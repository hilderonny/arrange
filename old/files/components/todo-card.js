/**
 * Einzelne TODO-Karte wie bei Habitica
 */
const style = `
:host {
    color: red;
}
`;
const template = `
<div class="leftbar">
    <button class="complete">OK</button>
</div>
<div class="rightbar">
    <h1>Header</h1>
    <button class="tasklistswitch">Switch</button>
    <div class="tasklist">Liste</div>
</div>
`;

customElements.define('todo-card', class extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.shadowRoot.innerHTML = `<style>${style}</style>${template}`;
    }

});