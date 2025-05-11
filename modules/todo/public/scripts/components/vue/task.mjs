import TaskChecklistitem from './task-checklistitem.mjs';

export default {
    components: {
        TaskChecklistitem
    },
    computed: {
        donechecklistitems() {
            return this.task.c.filter(c => !!c.c).length;
        }
    },
    emits: ['checkboxclick', 'taskclick', 'checklistitemclick', 'checklisttoggleclick'],
    methods: {
        marked,
        togglechecklistitem(checklistitem) {
            checklistitem.c = !checklistitem.c;
            this.$emit('checklistitemclick', checklistitem);
        },
        toggleopenchecklist() {
            this.task.co = !this.task.co;
            this.$emit('checklisttoggleclick');
        }
    },
    props: {
        task: Object
    },
    template: `
        <task :class="task.category">
            <task-checkbox @click="$emit('checkboxclick')"></task-checkbox>
            <task-content :class="{'visible': task.co}">
                <task-title @click="$emit('taskclick')">{{task.t}}</task-title>
                <task-note @click="$emit('taskclick')" v-html="marked(task.n)"></task-note>
                <task-checklist-toggle v-if="task.c.length > 0" @click="toggleopenchecklist">{{donechecklistitems}} / {{task.c.length}}</task-checklist-toggle>
                <task-checklist>
                    <task-checklistitem v-for="checklistitem in task.c" :item="checklistitem" @checkboxclick="togglechecklistitem(checklistitem)"></task-checklistitem>
                </task-checklist>
            </task-content>
        </task>
    `
}