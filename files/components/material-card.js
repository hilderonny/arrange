/**
 * Custom Element showing a closable card like AngularJs' md-card
 */
const style = `
:host {
    color: red;
}
`;
const template = `
Ich bin rot
`;

customElements.define('material-card', class extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.shadowRoot.innerHTML = `<style>${style}</style>${template}`;
    }

});