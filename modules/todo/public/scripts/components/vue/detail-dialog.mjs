export default {
    emits: ['closeclick'],
    props: {
        title: String
    },
    template: `
        <detail-dialog>
            <dialog-header>
                <dialog-toolbar>
                    <dialog-title>{{title}}</dialog-title>
                    <button @click="$emit('closeclick');">Schließen</button>
                </dialog-toolbar>
                <slot name="header"></slot>
            </dialog-header>
            <dialog-content>
                <slot name="content"></slot>
            </dialog-content>
            <dialog-footer>
                <slot name="footer"></slot>
            </dialog-footer>
        </detail-dialog>
    `
}