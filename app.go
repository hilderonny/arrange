// Version: 0.0.4
package main

import (
	"bufio"
	"crypto/aes"
	"crypto/cipher"
	crand "crypto/rand"
	"crypto/sha1"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/rand/v2"
	"mime/multipart"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"slices"
	"strconv"
	"time"
)

/********** Typdefinitionen **********/

type CredentialsStruct struct {
	Password string `json:"password"`
	Username string `json:"username"`
}

type DirEntryStruct struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type UserResponseStruct struct {
	Id       string `json:"id"`
	Username string `json:"username"`
}

type UserStruct struct {
	Id       string `json:"id"`
	Password string `json:"password"`
	Username string `json:"username"`
}

/********** Konstanten und globale Variable **********/

var USERS_JSON_PATH string = "./data/users/users.json" // Pfad zur JSON-Datei mit Benutzerinfos
var FILES_PATH string = "./data/files"                 // Pfad zu den Dateien
var ALL_USERS []UserStruct
var TOKEN_SECRET [32]byte
var NEXT_WEBSOCKET_CLIENT_ID int64 = time.Now().UTC().UnixNano()

var WEBSOCKET_CLIENTS = make(map[int64]net.Conn)
var WEBSOCKET_ROOMS = make(map[int64][]net.Conn)

const WEBSOCKET_ACCEPT_KEY_MAGIC = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"

/********** Hilfsfunktionen **********/

func createToken(user *UserStruct) string {
	return encryptString(user.Id, TOKEN_SECRET)
}

func decryptString(cipherTextBase64 string, key [32]byte) (string, error) {
	cipherText, err := base64.StdEncoding.DecodeString(cipherTextBase64)
	if err != nil {
		return "", err
	}
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonceSize := gcm.NonceSize()
	if len(cipherText) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}
	nonce, cipherText := cipherText[:nonceSize], cipherText[nonceSize:]
	plainText, err := gcm.Open(nil, nonce, cipherText, nil)
	if err != nil {
		return "", err
	}
	return string(plainText), nil
}

func disconnectSocket(connection net.Conn) {
	for roomId := range WEBSOCKET_ROOMS {
		leaveRoom(roomId, connection)
	}
	clientId, clientIdError := getClientIdForConnection(connection)
	if clientIdError == nil {
		delete(WEBSOCKET_CLIENTS, clientId)
	}
	connection.Close()
}

func encryptString(plainText string, key [32]byte) string {
	// Siehe https://tutorialedge.net/golang/go-encrypt-decrypt-aes-tutorial/
	block, _ := aes.NewCipher(key[:])
	gcm, _ := cipher.NewGCM(block)
	nonce := make([]byte, gcm.NonceSize())
	io.ReadFull(crand.Reader, nonce)
	cipherText := gcm.Seal(nonce, nonce, []byte(plainText), nil)
	return base64.StdEncoding.EncodeToString(cipherText)
}

func extractFirstFileFromRequest(request *http.Request) (multipart.File, error) {
	var maxUploadSize int64 = 1 << 40 // 1 TB
	err := request.ParseMultipartForm(maxUploadSize)
	if err != nil || request.MultipartForm == nil || request.MultipartForm.File == nil {
		return nil, err
	}
	for _, fileHeaders := range request.MultipartForm.File {
		if len(fileHeaders) != 0 {
			return fileHeaders[0].Open()
		}
	}
	return nil, errors.New("No files in request")
}

func extractUserFromCookie(request *http.Request) *UserStruct {
	arrangeCookie, arrangeCookieError := request.Cookie("arrange")
	if arrangeCookieError != nil {
		return nil
	}
	userId, decryptError := decryptString(arrangeCookie.Value, TOKEN_SECRET)
	if decryptError != nil {
		return nil
	}
	return getUserById(userId)
}

func getClientIdForConnection(connection net.Conn) (int64, error) {
	for clientId, clientConnection := range WEBSOCKET_CLIENTS {
		if clientConnection == connection {
			return clientId, nil
		}
	}
	return -1, fmt.Errorf("Not found")
}

func getUserById(id string) *UserStruct {
	for i := range ALL_USERS {
		if ALL_USERS[i].Id == id {
			return &ALL_USERS[i]
		}
	}
	return nil
}

func getUserByUsername(username string) *UserStruct {
	for i := range ALL_USERS {
		if ALL_USERS[i].Username == username {
			return &ALL_USERS[i]
		}
	}
	return nil
}

func handleWebsocketConnection(connection net.Conn, buffer *bufio.ReadWriter) {
	defer disconnectSocket(connection)
	for {
		receivedFrame, readError := readWebsocketFrame(buffer.Reader)
		if readError != nil {
			return
		}
		messageType := receivedFrame[0]
		switch messageType {
		case 0x10: // Join room
			roomId := int64(binary.LittleEndian.Uint64(receivedFrame[1:]))
			connectionList := WEBSOCKET_ROOMS[roomId]
			if !slices.Contains(connectionList, connection) {
				WEBSOCKET_ROOMS[roomId] = append(connectionList, connection)
			}
		case 0x20: // Leave room
			roomId := int64(binary.LittleEndian.Uint64(receivedFrame[1:]))
			leaveRoom(roomId, connection)
		case 0x30: // Send message to room
			roomId := int64(binary.LittleEndian.Uint64(receivedFrame[1:9]))
			frameToSend := make([]byte, 17)
			frameToSend[0] = 0x31
			senderId, _ := getClientIdForConnection(connection)
			binary.LittleEndian.PutUint64(frameToSend[1:9], uint64(senderId))
			binary.LittleEndian.PutUint64(frameToSend[9:17], uint64(roomId))
			frameToSend = append(frameToSend, receivedFrame[9:]...)
			for _, clientConnection := range WEBSOCKET_ROOMS[roomId] {
				writeWebsocketFrame(clientConnection, frameToSend)
			}
		case 0x40: // Send message to client
			clientId := int64(binary.LittleEndian.Uint64(receivedFrame[1:9]))
			clientConnection := WEBSOCKET_CLIENTS[clientId]
			if clientConnection != nil {
				frameToSend := receivedFrame[:]
				frameToSend[0] = 0x41
				senderId, _ := getClientIdForConnection(connection)
				binary.LittleEndian.PutUint64(frameToSend[1:9], uint64(senderId))
				writeWebsocketFrame(clientConnection, frameToSend)
			}
		}
	}
}

func hashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}

func leaveRoom(roomId int64, connection net.Conn) {
	connectionList := WEBSOCKET_ROOMS[roomId]
	index := slices.Index(connectionList, connection)
	if index >= 0 {
		updatedConnectionList := slices.Delete(connectionList, index, index+1)
		if len(updatedConnectionList) < 1 {
			delete(WEBSOCKET_ROOMS, roomId)
		} else {
			WEBSOCKET_ROOMS[roomId] = updatedConnectionList
		}
	}
}

func loadUsers() []UserStruct {
	if _, err := os.Stat(USERS_JSON_PATH); errors.Is(err, os.ErrNotExist) {
		os.MkdirAll(filepath.Dir(USERS_JSON_PATH), 0755)
		users := []UserStruct{}
		saveUsers(users)
		return users
	} else {
		fileContent, _ := os.ReadFile(USERS_JSON_PATH)
		var users []UserStruct
		json.Unmarshal(fileContent, &users)
		return users
	}
}

func readWebsocketFrame(reader *bufio.Reader) ([]byte, error) {
	// Erstes Byte: FIN + Opcode
	_, firstByteError := reader.ReadByte()
	if firstByteError != nil {
		return nil, firstByteError
	}
	// Zweites Byte: Mask + Payload Länge
	secondByte, secondByteError := reader.ReadByte()
	if secondByteError != nil {
		return nil, secondByteError
	}
	isMasked := secondByte&0x80 != 0
	payloadLength := int(secondByte & 0x7F)
	if payloadLength == 126 { // Bei langen Frames wird die Länge im 3. und 4. Byte kodiert
		thirdByte, _ := reader.ReadByte()
		fourthByte, _ := reader.ReadByte()
		payloadLength = int(thirdByte)<<8 | int(fourthByte)
	}
	if payloadLength == 127 {
		return nil, fmt.Errorf("Payload too big")
	}
	var maskKey [4]byte
	if isMasked {
		io.ReadFull(reader, maskKey[:])
	}
	payload := make([]byte, payloadLength)
	io.ReadFull(reader, payload)
	if isMasked {
		for i := 0; i < payloadLength; i++ {
			payload[i] ^= maskKey[i%4]
		}
	}
	return payload, nil
}

func saveUsers(users []UserStruct) {
	jsonContent, _ := json.MarshalIndent(users, "", "\t")
	os.WriteFile(USERS_JSON_PATH, jsonContent, 0644)
}

func setCookie(user *UserStruct, remove bool, response http.ResponseWriter) {
	value := ""
	maxAge := 30 * 24 * 60 * 60 // 30 Tage
	if remove == true {
		maxAge = -1
	}
	if user != nil {
		value = createToken(user)
	}
	arrangeCookie := http.Cookie{
		Name:     "arrange",
		Value:    value,
		MaxAge:   maxAge,
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
	}
	http.SetCookie(response, &arrangeCookie)
}

func writeWebsocketFrame(connection net.Conn, payload []byte) error {
	frame := []byte{}
	// FIN + Binary Frame
	frame = append(frame, 0x82)
	payloadLength := len(payload)
	if payloadLength < 126 {
		frame = append(frame, byte(payloadLength))
	} else if payloadLength < 65536 {
		frame = append(frame, 126, byte(payloadLength>>8), byte(payloadLength))
	} else {
		return fmt.Errorf("Payload too big")
	}
	frame = append(frame, payload...)
	_, writeError := connection.Write(frame)
	return writeError
}

/********** API Funktionen **********/

// Automatische Anmeldung anhand des Cookies
func handleAutoLogin(response http.ResponseWriter, request *http.Request) {
	userFromCookie := extractUserFromCookie(request)
	if userFromCookie == nil {
		response.WriteHeader(401)
		return
	}
	response.WriteHeader(200)
}

// Datei löschen
func handleDeletePath(response http.ResponseWriter, request *http.Request) {
	userId := request.PathValue("userid")
	path := request.PathValue("path")
	if userId == "" || path == "" {
		response.WriteHeader(400)
		return
	}
	userFromCookie := extractUserFromCookie(request)
	if userFromCookie == nil || (userId != "public" && userFromCookie.Id != userId) {
		response.WriteHeader(403)
		return
	}
	absoluteFilePath := filepath.Join(FILES_PATH, userId, path)
	if _, err := os.Stat(absoluteFilePath); err != nil {
		response.WriteHeader(404)
		return
	}
	os.RemoveAll(absoluteFilePath)
	response.WriteHeader(200)
}

// Datei oder Verzeichnisliste liefern
func handleGetFile(response http.ResponseWriter, request *http.Request) {
	userId := request.PathValue("userid")
	if userId == "" {
		response.WriteHeader(400)
		return
	}
	filePath := request.PathValue("filepath")
	userFromCookie := extractUserFromCookie(request)
	if userFromCookie == nil || (userId != "public" && userFromCookie.Id != userId) {
		response.WriteHeader(403)
		return
	}
	absoluteFilePath := filepath.Join(FILES_PATH, userId, filePath)
	fileStat, fileStatError := os.Stat(absoluteFilePath)
	if fileStatError != nil {
		response.WriteHeader(404)
		return
	}
	if fileStat.IsDir() {
		dirPointer, dirPointerError := os.Open(absoluteFilePath)
		if dirPointerError != nil {
			response.WriteHeader(500)
			return
		}
		dirEntries, filesError := dirPointer.ReadDir(-1)
		dirPointer.Close()
		if filesError != nil {
			response.WriteHeader(500)
			return
		}
		var files []DirEntryStruct
		for _, dirEntry := range dirEntries {
			fileType := "file"
			if dirEntry.IsDir() {
				fileType = "dir"
			}
			file := DirEntryStruct{
				Name: dirEntry.Name(),
				Type: fileType,
			}
			files = append(files, file)
		}
		json.NewEncoder(response).Encode(files)
	} else {
		http.ServeFile(response, request, absoluteFilePath)
	}
}

// Benutzer anmelden
func handleLogin(response http.ResponseWriter, request *http.Request) {
	var credentials CredentialsStruct
	err := json.NewDecoder(request.Body).Decode(&credentials)
	if err != nil || len(credentials.Username) < 1 || len(credentials.Password) < 1 {
		response.WriteHeader(400)
		return
	}
	user := getUserByUsername(credentials.Username)
	if user == nil {
		response.WriteHeader(401)
		return
	}
	hashedPassword := hashPassword(credentials.Password)
	if hashedPassword != user.Password {
		response.WriteHeader(401)
		return
	}
	setCookie(user, false, response)
	userToReturn := UserResponseStruct{
		Id:       user.Id,
		Username: user.Username,
	}
	json.NewEncoder(response).Encode(userToReturn)
}

// Benutzer abmelden
func handleLogout(response http.ResponseWriter, request *http.Request) {
	setCookie(nil, true, response)
	response.WriteHeader(200)
}

// Datei speichern
func handlePostFile(response http.ResponseWriter, request *http.Request) {
	userId := request.PathValue("userid")
	filePath := request.PathValue("filepath")
	if userId == "" || filePath == "" {
		response.WriteHeader(400)
		return
	}
	userFromCookie := extractUserFromCookie(request)
	if userFromCookie == nil || (userId != "public" && userFromCookie.Id != userId) {
		response.WriteHeader(403)
		return
	}
	absoluteFilePath := filepath.Join(FILES_PATH, userId, filePath)
	parentDir := filepath.Dir(absoluteFilePath)
	if os.MkdirAll(parentDir, 0755) != nil {
		response.WriteHeader(500)
		return
	}
	if request.Header["Content-Type"][0] == "application/octet-stream" {
		// Binärdateien per Upload
		file, fileError := os.Create(absoluteFilePath)
		if fileError != nil {
			response.WriteHeader(500)
			return
		}
		defer file.Close()
		_, writeError := io.Copy(file, request.Body)
		if writeError != nil {
			response.WriteHeader(500)
			return
		}
	} else {
		// Textdateien direkt im Multipart-Body
		firstFile, firstFileError := extractFirstFileFromRequest(request)
		if firstFileError != nil {
			response.WriteHeader(400)
			return
		}
		defer firstFile.Close() // Sicherstellen, dass auch bei Fehlern die Datei wieder geschlossen wird
		fileContent, fileContentError := io.ReadAll(firstFile)
		if fileContentError != nil {
			response.WriteHeader(400)
			return
		}
		if os.WriteFile(absoluteFilePath, fileContent, 0644) != nil {
			response.WriteHeader(500)
			return
		}
	}
	response.WriteHeader(200)
}

// Verzeichnis erstellen
func handlePutPath(response http.ResponseWriter, request *http.Request) {
	userId := request.PathValue("userid")
	path := request.PathValue("path")
	if userId == "" || path == "" {
		response.WriteHeader(400)
		return
	}
	userFromCookie := extractUserFromCookie(request)
	if userFromCookie == nil || (userId != "public" && userFromCookie.Id != userId) {
		response.WriteHeader(403)
		return
	}
	absolutePath := filepath.Join(FILES_PATH, userId, path)
	if os.MkdirAll(absolutePath, 0755) != nil {
		response.WriteHeader(500)
		return
	}
	response.WriteHeader(200)
}

// Benutzer registrieren
func handleRegister(response http.ResponseWriter, request *http.Request) {
	var credentials CredentialsStruct
	err := json.NewDecoder(request.Body).Decode(&credentials)
	if err != nil || len(credentials.Username) < 1 || len(credentials.Password) < 1 {
		response.WriteHeader(400)
		return
	}
	usernameValidator := regexp.MustCompile(`^[A-Za-z0-9_.-]+$`)
	if !usernameValidator.MatchString(credentials.Username) {
		response.WriteHeader(400)
		return
	}
	existingUser := getUserByUsername(credentials.Username)
	if existingUser != nil {
		response.WriteHeader(409)
		return
	}
	hashedPassword := hashPassword(credentials.Password)
	userToStore := UserStruct{
		Id:       strconv.FormatInt(time.Now().UnixNano()+int64(rand.Int32()), 10),
		Username: credentials.Username,
		Password: hashedPassword,
	}
	ALL_USERS = append(ALL_USERS, userToStore)
	saveUsers(ALL_USERS)
	setCookie(&userToStore, false, response)
	userToReturn := UserResponseStruct{
		Id:       userToStore.Id,
		Username: userToStore.Username,
	}
	json.NewEncoder(response).Encode(userToReturn)
}

// Websocketverbindung erstellen
func handleConnectWebSocket(response http.ResponseWriter, request *http.Request) {
	hijacker, _ := response.(http.Hijacker)
	connection, buffer, hijackError := hijacker.Hijack()
	if hijackError != nil {
		return
	}
	requestKey := request.Header.Get("Sec-WebSocket-Key")
	sha1Hash := sha1.Sum([]byte(requestKey + WEBSOCKET_ACCEPT_KEY_MAGIC))
	acceptResponseKey := base64.StdEncoding.EncodeToString(sha1Hash[:])
	connectResponse := "HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: " + acceptResponseKey + "\r\n\r\n"
	connection.Write([]byte(connectResponse))
	// ID senden
	clientIdResponseFrame := make([]byte, 9)
	clientIdResponseFrame[0] = 0x01
	binary.LittleEndian.PutUint64(clientIdResponseFrame[1:], uint64(NEXT_WEBSOCKET_CLIENT_ID)) // Das Casting ist nur notwendig, um die PutUint64 Funktion nutzen zu können, hat clientseitig keine Bedeutung
	WEBSOCKET_CLIENTS[NEXT_WEBSOCKET_CLIENT_ID] = connection
	NEXT_WEBSOCKET_CLIENT_ID = NEXT_WEBSOCKET_CLIENT_ID + 1
	writeClientIdError := writeWebsocketFrame(connection, clientIdResponseFrame)
	if writeClientIdError != nil {
		return
	}
	handleWebsocketConnection(connection, buffer)
}

/********** Server ***********/

func main() {

	// Token bei jedem Neustart neu generieren, dann müssen siche Benutzer neu anmelden
	crand.Read(TOKEN_SECRET[:])

	// Benutzerdatenbank laden
	ALL_USERS = loadUsers()

	// API-Endpunkte
	http.HandleFunc("GET /api/autologin", handleAutoLogin)
	http.HandleFunc("POST /api/login", handleLogin)
	http.HandleFunc("GET /api/logout", handleLogout)
	http.HandleFunc("POST /api/register", handleRegister)
	http.HandleFunc("DELETE /api/files/{userid}/{path...}", handleDeletePath)
	http.HandleFunc("GET /api/files/{userid}/{filepath...}", handleGetFile)
	http.HandleFunc("POST /api/files/{userid}/{filepath...}", handlePostFile)
	http.HandleFunc("PUT /api/files/{userid}/{path...}", handlePutPath)

	// Statische HTML Seiten ausliefern, wird reingemountet
	http.Handle("/", http.FileServer(http.Dir("./html")))

	// Arrange-Client-Skripte und Seiten ausliefern
	http.Handle("/arrange/", http.StripPrefix("/arrange/", http.FileServer(http.Dir("./arrange"))))

	// Websockets
	http.HandleFunc("/ws", handleConnectWebSocket)

	// // HTTP-Server starten, geht in Endlosschleife
	fmt.Println("arrange server running at port 3000")
	http.ListenAndServe(":3000", nil)

}
