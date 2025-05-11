export default {
    emits: ['checkboxclick'],
    methods: {
        marked
    },
    props: {
        item: Object
    },
    template: `
        <task-checklistitem>
            <input type="checkbox" v-model="item.checked" @click="$emit('checkboxclick')" />
            <label v-html="marked(item.title)"></label>
        </task-checklistitem>
    `
}