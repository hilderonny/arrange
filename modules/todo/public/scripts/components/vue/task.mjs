import TaskChecklistitem from './task-checklistitem.mjs';

export default {
    components: {
        TaskChecklistitem
    },
    computed: {
        donechecklistitems() {
            return this.task.checklist.filter(item => !!item.checked).length;
        }
    },
    emits: ['checkboxclick', 'taskclick', 'checklistitemclick', 'checklisttoggleclick'],
    methods: {
        marked,
        togglechecklistitem(checklistitem) {
            checklistitem.checked = !checklistitem.checked;
            this.$emit('checklistitemclick', checklistitem);
        },
        toggleopenchecklist() {
            this.task.ischecklistopen = !this.task.ischecklistopen;
            this.$emit('checklisttoggleclick');
        }
    },
    props: {
        task: Object
    },
    template: `
        <task :class="task.category">
            <task-checkbox @click="$emit('checkboxclick')"></task-checkbox>
            <task-content :class="{'visible': task.ischecklistopen}">
                <task-title @click="$emit('taskclick')">{{task.title}}</task-title>
                <task-note @click="$emit('taskclick')" v-html="marked(task.notes)"></task-note>
                <task-checklist-toggle v-if="task.checklist.length > 0" @click="toggleopenchecklist">{{donechecklistitems}} / {{task.checklist.length}}</task-checklist-toggle>
                <task-checklist>
                    <task-checklistitem v-for="checklistitem in task.checklist" :item="checklistitem" @checkboxclick="togglechecklistitem(checklistitem)"></task-checklistitem>
                </task-checklist>
            </task-content>
        </task>
    `
}