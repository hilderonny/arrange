import DetailDialog from './components/vue/detail-dialog.mjs';
import FilterButton from './components/vue/filter-button.mjs';
import LabelledInput from './components/vue/labelled-input.mjs';
import LabelledSelect from './components/vue/labelled-select.mjs';
import PlayerWidget from './components/vue/player-widget.mjs';
import Task from './components/vue/task.mjs';
import experiencehelper from './utils/experiencehelper.mjs';

const app = {
  components: {
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
      taskidtoselect: undefined,
      tasks: [],
      taskcategories: [
        { label: "Rot", value: "rot", color: '#ff3b30' },
        { label: "Gelb", value: "gelb", color: '#ffcc00' },
        { label: "Grün", value: "gruen", color: '#4cda63' },
        { label: "Lila", value: "lila", color: '#b425d8' },
        { label: "Grau", value: "grau", color: '#8f8e93' },
        { label: "Hellblau", value: "hellblau", color: '#5ac9fa' },
        { label: "Orange", value: "orange", color: '#ff9601' },
        { label: "Rosa", value: "rosa", color: '#ff6684' },
        { label: "Blau", value: "blau", color: '#017aff' },
      ],
    }
  },
  async mounted() {
    // Vue ist fertig geladen
    await this.loadplayer();
    await this.loadtasks();
    this.loaded = true;
  },
  methods: {
    ...experiencehelper,
    addchecklistitem() {
      this.selectedtask.c.push({ c: false, t: '' });
      Vue.nextTick(() => {
        this.$refs.newchecklistitem.previousElementSibling.focus();
      });
    },
    async addtask(category) {
      /**
       * t: title
       * n: notes
       * c: checklist
       * c.c: checked
       * c.t: title
       */
      const newtask = { i: 'task-' + Date.now(), c: [], t: '', n: '', co: false, category: category ? category.value : 'gelb' };
      this.taskidtoselect = newtask.i;
      this.tasks.push(newtask)
      this.selectedtask = newtask
      await this.save()
    },
    checkchecklistitemcontent(checklistitem) {
      if (checklistitem.t.length < 1) {
        this.selectedtask.c.splice(this.selectedtask.c.indexOf(checklistitem), 1);
      }
    },
    async completetask(task) {
      this.player.experience += 10 + task.c.filter(c => !!c.c).length; // 10 je Task und 1 je abgeschlossenem ChecklistItem
      this.player.coins += 5 + task.c.filter(c => !!c.c).length; // 5 je Task und 1 je abgeschlossenem ChecklistItem
      this.tasks.splice(this.tasks.findIndex(t => t === task), 1)
      await this.save()
      await this.saveplayer()
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
    async loadplayer() {
      this.player = JSON.parse(localStorage.getItem('player') || '{ "name": "Player 1", "experience": 0, "coins": 0 }')
    },
    async loadtasks() {
      this.tasks = JSON.parse(localStorage.getItem('tasks') || '[]')
      for (const task of this.tasks) {
        if (this.taskidtoselect && task.i === this.taskidtoselect) {
          this.selectedtask = task;
          this.taskidtoselect = undefined;
        }
      }
      this.finishedloading = true;
    },
    async save() {
      localStorage.setItem('tasks', JSON.stringify(this.tasks))
    },
    async saveplayer() {
      // Nur das in die Datenbank schreiben, was auch wirklich notwendig ist
      // Damit kann das player Objekt lokal noch erweitert werden, ohne dass die Daten in der DB landen
      const playertosave = {
        name: this.player.name,
        experience: this.player.experience,
        coins: this.player.coins,
      };
      localStorage.setItem('player', JSON.stringify(playertosave))
    },
    tasksforcategory(category) {
      return this.tasks.filter(t => t.category === category.value);
    }
  }
}

Vue.createApp(app).mount('body');
