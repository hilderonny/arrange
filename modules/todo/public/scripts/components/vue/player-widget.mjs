import PlayerProgressbar from './player-progressbar.mjs';
import experiencehelper from '../../utils/experiencehelper.mjs';

export default {
    components: {
        PlayerProgressbar
    },
    emits: ['playernameclick'],
    methods: {
        ...experiencehelper
    },
    props: {
        player: Object
    },
    template: `
        <player-widget>
            <avatar><img src="images/avatar_tiny.jpg" /></avatar>
            <playerinfo>
                <playername @click="$emit('playernameclick')">{{player.username}}</playername>
                <playerdetails>
                    <playerlevel>Level {{levelforexperience(player.experience)}}</playerlevel>
                    <playercoins>{{player.coins}}</playercoins>
                </playerdetails>
                <player-progressbar type="experience" :percent="experiencepercentinlevel(player.experience)" :current="player.experience" :max="minexperiencefornextlevel(levelforexperience(player.experience))" ></player-progressbar>
            </playerinfo>
        </player-widget>
    `
}