export default {
    emits: ['input'],
    methods: {
        handleInput(evt) {
            this.$emit('input', evt.target.value);
        }
    },
    props: {
        label: String,
        placeholder: String,
        rows: { type: Number, default: 1 },
        value: String,
    },
    template: `
        <labelled-input>
            <label>{{label}}</label>
            <input v-if="rows < 2" type="text" :placeholder="placeholder" :value="value" @input="handleInput" />
            <textarea v-if="rows > 1" :rows="rows" :placeholder="placeholder" :value="value" @input="handleInput"></textarea>
        </labelled-input>
    `
} 