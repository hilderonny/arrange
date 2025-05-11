export default {
    props: {
        current: String,
        max: String,
        percent: Number,
        type: String
    },
    template: `
        <player-progressbar :type="type">
            <progressbar>
                <progressvalue :style="'width: ' + percent + '%'"></progressvalue>
            </progressbar>
            <progresstext>{{current}} / {{max}}</progresstext>
        </player-progressbar>
    `
}