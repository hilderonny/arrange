import ColoredInput from './components/vue/colored-input.mjs';
import DetailDialog from './components/vue/detail-dialog.mjs';
import FilterButton from './components/vue/filter-button.mjs';
import LabelledInput from './components/vue/labelled-input.mjs';
import LabelledSelect from './components/vue/labelled-select.mjs';
import PlayerWidget from './components/vue/player-widget.mjs';
import Task from './components/vue/task.mjs';
import experiencehelper from './utils/experiencehelper.mjs';

const app = {
  components: {
    ColoredInput,
    DetailDialog,
    FilterButton,
    LabelledInput,
    LabelledSelect,
    PlayerWidget,
    Task
  },
  data() {
    return {
      finishedloading: false,
      loaded: false,
      marked: window.marked,
      showplayerdetails: false,
      selectedtask: undefined,
      player: undefined,
      tasks: undefined,
    }
  },
  async mounted() {
    // Vue ist fertig geladen
    await this.loadPlayerData();
    this.loaded = true;
  },
  methods: {
    ...experiencehelper,
    addchecklistitem() {
      this.selectedtask.checklist.push({ checked: false, title: '' });
      Vue.nextTick(() => {
        this.$refs.newchecklistitem.parentNode.previousElementSibling.querySelector('input').focus();
      });
    },
    async addtask(category) {
      const newtask = { 
        checklist: [], 
        title: '', 
        notes: '', 
        ischecklistopen: false, 
        category: category ? category.value : 'gelb'
      };
      this.tasktoselect = newtask;
      this.tasks.push(newtask)
      this.selectedtask = newtask
      await this.save()
    },
    async completetask(task) {
      const doneCount = task.checklist.filter(item => !!item.checked).length
      this.player.experience += 10 + doneCount; // 10 je Task und 1 je abgeschlossenem ChecklistItem
      this.player.coins += 5 + doneCount; // 5 je Task und 1 je abgeschlossenem ChecklistItem
      this.tasks.splice(this.tasks.findIndex(t => t === task), 1)
      await this.save()
    },
    deletechecklistitem(checklistitem) {
      this.selectedtask.checklist.splice(this.selectedtask.checklist.indexOf(checklistitem), 1);
    },
    async deleteselectedtask() {
      if (!window.confirm('Wirklich löschen?')) return
      this.tasks.splice(this.tasks.findIndex(t => t === this.selectedtask), 1)
      await this.save()
      this.selectedtask = undefined
    },
    async handlekey(evt) {
      if (evt.keyCode === 13) {
        await this.save()
        this.selectedtask = undefined
      }
    },
    async loadPlayerData() {
      const response = await fetch('/api/todo/todos')
      this.player = await response.json()
      if (!this.player.categories) {
        this.player.categories = [
          { label: "Rot", value: "rot", color: '#ff3b30' },
          { label: "Gelb", value: "gelb", color: '#ffcc00' },
          { label: "Grün", value: "gruen", color: '#4cda63' },
          { label: "Lila", value: "lila", color: '#b425d8' },
          { label: "Grau", value: "grau", color: '#8f8e93' },
          { label: "Hellblau", value: "hellblau", color: '#5ac9fa' },
          { label: "Orange", value: "orange", color: '#ff9601' },
          { label: "Rosa", value: "rosa", color: '#ff6684' },
          { label: "Blau", value: "blau", color: '#017aff' },
        ]
      }
      this.tasks = this.player.tasks
      this.finishedloading = true
    },
    async save() {
      const playerData = JSON.stringify(this.player)
      // Zur Sicherheit im localStorage speichern, falls der Server ausfällt oder so
      localStorage.setItem('playerdata', playerData)
      // An Server senden
      await fetch('/api/todo/savetodos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: playerData
      })
    },
    tasksforcategory(category) {
      return this.tasks.filter(t => t.category === category.value);
    }
  }
}

Vue.createApp(app).mount('body');
