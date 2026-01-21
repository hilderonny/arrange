// Version: 0.0.2
package main

import (
	"crypto/aes"
	"crypto/cipher"
	crand "crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/rand/v2"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
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

func hashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
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
	absoluteFilePath := filepath.Join(FILES_PATH, userId, filePath)
	parentDir := filepath.Dir(absoluteFilePath)
	if os.MkdirAll(parentDir, 0755) != nil {
		response.WriteHeader(500)
		return
	}
	if os.WriteFile(absoluteFilePath, fileContent, 0644) != nil {
		response.WriteHeader(500)
		return
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

	// // HTTP-Server starten, geht in Endlosschleife
	fmt.Println("arrange server running at port 3000")
	http.ListenAndServe(":3000", nil)

}
