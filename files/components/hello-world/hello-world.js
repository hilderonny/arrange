import { WebComponent } from '/utils/webcomponents.js';

export default class extends WebComponent {


    constructor() {
        super();
    }

    clickMe() {
        alert('You clicked: ' + this.alert);
    }

}
