const {createApp} = Vue;

const KanbanBoard = createApp({
    data() {
        return {
            title: 'Kanban Board',

            columns: [
                {id: 1, max: Infinity, title: "Запланированные задачи", cardsTask: []},
                {id: 2, max: Infinity, title: "В работе", cardsTask: []},
                {id: 3, max: Infinity, title: "Тестирование", cardsTask: []},
                {id: 4, max: Infinity, title: "Выполненные задачи", cardsTask: []},
            ],
            errorMassage: '',
        };
    },
    methods: {
        save() {
            try {
                localStorage.setItem('tasks', JSON.stringify(this.columns));
            } catch (e) {
                console.error('Error saving to localStorage:', e);
            }
        },
        load() {
            const saved = localStorage.getItem('tasks');
            if (saved) {
                try {
                    this.columns = JSON.parse(saved);
                } catch (e) {
                    console.error('Error loading from localStorage:', e);
                }
            }
        },
        addTask() {
            // const dateAddTask =
            const hasTitle = this.title.length > 0;

        },

    }
})