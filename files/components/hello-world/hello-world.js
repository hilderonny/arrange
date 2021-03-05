import { WebComponent } from '/utils/webcomponents.js';

export default class extends WebComponent {

    title = 'Greetings';
    h1class = 'yellow';
    alert;

    constructor() {
        super();
        for (const attribute of this.attributes) {
            if (this.hasOwnProperty(attribute.name)) this[attribute.name] = attribute.value;
        }
    }

    clickMe() {
        alert('You clicked: ' + this.alert);
    }

}
