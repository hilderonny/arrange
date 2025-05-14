export default {
    data() {
        return {
            open: false,
        }
    },
    emits: ['input'],
    methods: {
        handleInput(evt) {
            const selectedValues = Array.from(evt.target.selectedOptions).map(o => o.value);
            this.$emit('input', selectedValues);
        },
        toggleSelect() {
            this.open = !this.open;
            this.$nextTick(() => {
                const select = this.$el.querySelector('select');
                if (select) select.focus();
            });
        },
    },
    props: {
        options: { type: Array, default: [] },
        values: { type: Array, default: [] },
    },
    template: `
        <filter-button>
            <button @click="toggleSelect">{{ open ? '◮' : '⧨' }}</button>
            <select v-if="open" multiple @input="handleInput" :size="options.length">
                <option v-for="option in options" :selected="values && values.includes(option.value)" :value="option.value" :class="option.value">{{option.label}}</option>
            </select>
        </filter-button>
    `
} 