/**
 * Custom Element example completely without dependency to any frameworks.
 * Can be included by a simple script tag in the head:
 * <script src="components/hello-world.js"></script>
 */
const style = `
:host {
    color: red;
}

button {
    background-color: chartreuse;
}

.blue {
    color: blue;
}

.yellow {
    color: yellow;
}
`;
const template = `
<h1></h1>
<p>Hello world!</p>
<button>Click me!</button>
`;

customElements.define('hello-world', class extends HTMLElement {

    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.shadowRoot.innerHTML = `<style>${style}</style>${template}`;
        this.shadowRoot.querySelector('button').addEventListener('click', this.clickMe.bind(this));
        this.update();
    }

    // After inserting into DOM and initialls defining the attributes reflect them in the shadow DOM
    connectedCallback() {
        this.update();
    }

    // Define on which attributes the attributeChangedCallback() method should react on
    static get observedAttributes() {return [ 'h1class', 'title' ]; }

    attributeChangedCallback() {
        this.update();
    }

    clickMe() {
        alert('You clicked: ' + this.getAttribute('alert'));
    }

    update() {
        const h1tag = this.shadowRoot.querySelector('h1');
        h1tag.setAttribute('class', this.getAttribute('h1class'));
        h1tag.innerHTML = this.getAttribute('title');
    }

});