export default class extends HTMLElement {

    constructor() {
        super();
        setInterval(() => {
            console.log(Date.now());
        }, 5000);
    }

}
