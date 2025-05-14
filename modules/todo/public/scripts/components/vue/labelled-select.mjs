export default {
    emits: ['input'],
    methods: {
        handleInput(evt) {
            this.$emit('input', evt.target.value);
        }
    },
    props: {
        cls: String,
        label: String,
        options: Object,
        value: String,
    },
    template: `
        <labelled-select>
            <label>{{label}}</label>
            <slot></slot>
            <select @input="handleInput" :class="cls">
                <option v-for="option in options" :selected="value === option.value" :class="option.value" :value="option.value">{{option.label}}</option>
            </select>
        </labelled-select>
    `
} 