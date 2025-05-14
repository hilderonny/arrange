export default {
    emits: ['input'],
    methods: {
        handleInput(evt) {
            this.$emit('input', evt.target.value);
        }
    },
    props: {
        color: String,
        value: String,
    },
    template: `
        <colored-input>
            <label>{{label}}</label>
            <input type="text" :value="value" @input="handleInput" :style="{ 'background-color': color }" />
        </colored-input>
    `
} 