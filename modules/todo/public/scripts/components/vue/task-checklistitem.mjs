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
            <input type="checkbox" v-model="item.c" @click="$emit('checkboxclick')" />
            <label v-html="marked(item.t)"></label>
        </task-checklistitem>
    `
}