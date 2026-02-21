const { createApp } = Vue;

const taskCard = {
    props: {
        card: {
            type: Object,
            required: true
        },
        columnId: {
            type: Number,
            required: true
        },
        availableColumns: {
            type: Array,
            required: true
        }
    },
    emits: ['update-card', 'remove-card', 'move-card', 'return-card'],
    data() {
        return {
            isEditing: false,
            editTitle: this.card.title,
            editDescription: this.card.description,
            editDateDeadLine: this.card.dateDeadLine ? new Date(this.card.dateDeadLine).toISOString().split('T')[0] : ''
        };
    },
    computed: {
        canMoveBackward() {
            if (!this.availableColumns) return false;
            const cid = Number(this.columnId);
            return cid !== 4 && this.getColumnIndex(cid) > 0;
        },
        canMoveForward() {
            if (!this.availableColumns) return false;
            const cid = Number(this.columnId);
            const currentIndex = this.getColumnIndex(cid);
            return currentIndex < this.availableColumns.length - 1;
        }
    },
    methods: {
        formatDate(timestamp) {
            if (!timestamp) return 'Не указан';
            const date = new Date(timestamp);
            return isNaN(date.getTime())
                ? 'Некорректная дата'
                : date.toLocaleDateString('ru-RU');
        },
        startEditing() {
            this.isEditing = true;
        },
        saveEdit() {
            if (!this.editTitle.trim()) {
                alert('Заголовок обязателен');
                return;
            }
            this.card.title = this.editTitle;
            this.card.description = this.editDescription;
            this.card.dateDeadLine = this.editDateDeadLine ? new Date(this.editDateDeadLine).getTime() : null;
            this.card.lastEditedAt = Date.now();
            this.isEditing = false;
            this.$emit('update-card', this.card.id);
        },
        cancelEdit() {
            this.isEditing = false;
            this.editTitle = this.card.title;
            this.editDescription = this.card.description;
            this.editDateDeadLine = this.card.dateDeadLine ? new Date(this.card.dateDeadLine).toISOString().split('T')[0] : '';
        },
        updateCard() {
            this.startEditing();
        },
        onRemoveCard() {
            this.$emit('remove-card', this.card.id);
        },
        moveBackward() {
            if (!this.card || !this.card.id) {
                console.error('[taskCard] moveBackward: card invalid', this.card);
                return;
            }
            this.$emit('move-card', {
                cardId: this.card.id,
                direction: 'backward'
            });
        },
        moveForward() {
            if (!this.card || !this.card.id) {
                console.error('[taskCard] moveForward: card invalid', this.card);
                return;
            }
            this.$emit('move-card', {
                cardId: this.card.id,
                direction: 'forward'
            });
        },
        returnCard() {
            const reason = prompt('Укажите причину возврата:');
            if (reason === null || reason.trim() === '') return;
            this.$emit('return-card', {
                cardId: this.card.id,
                reason: reason.trim(),
                targetColumnId: 2
            });
        },
        getColumnIndex(columnId) {
            if (!this.availableColumns) return -1;
            return this.availableColumns.findIndex(col => col.id === columnId);
        }
    },
    template: `
  <div class="task-card">
    <div class="card-header">
      <h4 class="card-title">{{ card.title }}</h4>
      <div class="card-actions">
        <button
          @click="updateCard"
          class="btn-action btn-edit"
          title="Редактировать карточку"
        >
          ✏️
        </button>
        <button
          @click="onRemoveCard"
          class="btn-action btn-remove"
          title="Удалить карточку"
        >
          🗑️
        </button>
        <button
          v-if="columnId === 3"
          @click="returnCard"
          class="btn-action btn-return"
          title="Вернуть в работу"
        >
          ↩️
        </button>
      </div>
    </div>

    <div class="card-body">
      <template v-if="!isEditing">
        <p class="card-description">{{ card.description }}</p>

        <p class="card-edited-at" v-if="card.lastEditedAt">
          <strong>Изменено:</strong> {{ formatDate(card.lastEditedAt) }}
        </p>

        <template v-if="card.dateDeadLine">
          <p class="card-deadline">
            <strong>Дедлайн:</strong> {{ formatDate(card.dateDeadLine) }}
          </p>
        </template>

        <template v-if="card.completedAt">
          <p class="card-completed">
            <strong>Выполнено:</strong> {{ formatDate(card.completedAt) }}
          </p>
        </template>

        <template v-if="card.reasonsForTheRefund">
          <p class="card-reason">
            <strong>Причина возврата:</strong> {{ card.reasonsForTheRefund }}
          </p>
        </template>

        <template v-if="card.completedAt">
          <p :class="['card-status', card.isOverdue ? 'overdue' : 'on-time']">
            {{ card.isOverdue ? '⚠️ Просрочено' : '✅ В срок' }}
          </p>
        </template>
      </template>

      <template v-else>
        <input
          v-model="editTitle"
          class="edit-input"
          placeholder="Заголовок"
        />
        <textarea
          v-model="editDescription"
          class="edit-textarea"
          placeholder="Описание"
        ></textarea>
        <input
          v-model="editDateDeadLine"
          type="date"
          class="edit-date"
        />
        <div class="edit-actions">
          <button @click="saveEdit" class="btn-save">Сохранить</button>
          <button @click="cancelEdit" class="btn-cancel">Отмена</button>
        </div>
      </template>
    </div>

    <div class="card-footer">
      <button
        @click="moveBackward"
        class="btn-move btn-backward"
        :disabled="columnId === 4 || getColumnIndex(columnId) <= 0 || columnId === 3"
        title="Переместить в предыдущую колонку"
      >
        ◀️
      </button>
      <button
        @click="moveForward"
        class="btn-move btn-forward"
        :disabled="false"
        title="Переместить в следующую колонку"
      >
        ▶️
      </button>
    </div>
  </div>
`,
};

const columnBoard = {
    components: {
        'task-card': taskCard,
    },
    props: {
        cardsTask: {
            type: Array,
            required: true,
        },
        columnId: {
            type: Number,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        columns: {
            type: Array,
            required: true
        }
    },
    emits: ['move-card', 'remove-card', 'update-card', 'return-card'],
    methods: {
        handleMoveCard(payload) {
            console.log('[columnBoard] move-card received:', payload);
            this.$emit('move-card', payload);
        },
        handleRemoveCard(cardId) {
            console.log('[columnBoard] remove-card received:', cardId);
            this.$emit('remove-card', {
                cardId: cardId,
                columnId: this.columnId
            });
        },
        handleUpdateCard(cardId) {
            console.log('[columnBoard] update-card received:', cardId);
            this.$emit('update-card', cardId);
        },
        handleReturnCard(payload) {
            console.log('[columnBoard] return-card received:', payload);
            this.$emit('return-card', payload);
        },
        handleColumnBack() {
            alert('Массовый возврат всех задач из тестирования в работу');
        }
    },
    template: `
  <div class="kanban-column">
    <h3 class="column-title">{{ title }}</h3>
    <p class="column-stats">
      Задач: {{ cardsTask.length }} / ∞
    </p>

    <task-card
      v-for="card in cardsTask"
      :key="card.id"
      :card="card"
      :columnId="columnId"
      :availableColumns="columns"
      @remove-card="handleRemoveCard"
      @update-card="handleUpdateCard"
      @move-card="handleMoveCard"
      @return-card="handleReturnCard"
    ></task-card>

    <div v-if="cardsTask.length === 0" class="empty-column">
      Колонка пуста
    </div>

  </div>
    `,
};

const KanbanBoard = {
    components: {
        'column-board': columnBoard
    },
    data() {
        return {
            titleBoard: 'Канбан доска',
            columns: [
                { id: 1, max: Infinity, title: "Запланированные задачи", cardsTask: [] },
                { id: 2, max: Infinity, title: "В работе", cardsTask: [] },
                { id: 3, max: Infinity, title: "Тестирование", cardsTask: [] },
                { id: 4, max: Infinity, title: "Выполненные задачи", cardsTask: [] },
            ],
            errorMessage: '',
            title: '',
            description: '',
            dateDeadLine: '',
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
            const title = this.title.trim();
            const description = this.description.trim();
            if (!title) {
                this.errorMessage = 'Введите заголовок';
                return;
            }
            if (!description) {
                this.errorMessage = 'Введите описание задачу';
                return;
            }
            const card = {
                id: Date.now() + Math.random().toString(36).substr(2, 10),
                title: title,
                description: description,
                dateDeadLine: this.dateDeadLine ? new Date(this.dateDeadLine).getTime() : null,
                completedAt: null,
                reasonsForTheRefund: null,
                lastEditedAt: Date.now()
            };
            this.columns[0].cardsTask.push(card);
            this.save();
            this.title = '';
            this.description = '';
            this.dateDeadLine = '';
            this.errorMessage = '';
        },
        removeCard(payload) {
            console.log('[KanbanBoard] removeCard called with:', payload);
            const { cardId, columnId } = payload;
            const column = this.columns.find(col => col.id === columnId);
            if (!column) return;
            column.cardsTask = column.cardsTask.filter(card => card.id !== cardId);
            this.save();
        },
        handleUpdateCard(cardId) {
            console.log('[KanbanBoard] updateCard called for:', cardId);
            const card = this.findCardById(cardId);
            if (!card) return;
            card.lastEditedAt = Date.now();
            this.save();
        },
        handleMoveCard({ cardId, direction }) {
            console.log('[KanbanBoard] moveCard called:', { cardId, direction });
            const card = this.findCardById(cardId);
            if (!card) {
                console.warn('Карточка не найдена по id:', cardId);
                return;
            }

            const currentColumnIndex = this.columns.findIndex(col =>
                col.cardsTask.some(c => c.id === cardId)
            );

            if (currentColumnIndex === -1) {
                console.warn('Карточка не найдена ни в одной колонке:', cardId);
                return;
            }

            let targetColumnIndex;
            if (direction === 'forward') {
                targetColumnIndex = currentColumnIndex + 1;
            } else if (direction === 'backward') {
                targetColumnIndex = currentColumnIndex - 1;
            } else {
                return;
            }

            if (targetColumnIndex < 0 || targetColumnIndex >= this.columns.length) return;

            if (targetColumnIndex === 3) {
                const now = Date.now();
                card.isOverdue = card.dateDeadLine && card.dateDeadLine < now;
                card.completedAt = now;
                card.reasonsForTheRefund = null;
            } else if (currentColumnIndex === 3) {
                card.isOverdue = false;
                card.completedAt = null;
            }

            this.moveToColumn(card, this.columns[targetColumnIndex].id);
        },
        handleReturnCard({ cardId, reason, targetColumnId }) {
            console.log('[KanbanBoard] returnCard called:', { cardId, reason, targetColumnId });
            const card = this.findCardById(cardId);
            if (!card) return;
            card.reasonsForTheRefund = reason;
            card.completedAt = null;
            card.isOverdue = false;
            this.moveToColumn(card, targetColumnId);
        },
        moveToColumn(card, targetColumnId) {
            for (const column of this.columns) {
                const index = column.cardsTask.findIndex(c => c.id === card.id);
                if (index !== -1) {
                    column.cardsTask.splice(index, 1);
                    break;
                }
            }

            const target = this.columns.find(col => col.id === targetColumnId);
            if (target && !target.cardsTask.some(c => c.id === card.id)) {
                target.cardsTask.push(card);
                this.save();
                return true;
            }
            return false;
        },
        findCardById(cardId) {
            for (const column of this.columns) {
                const card = column.cardsTask.find(c => c.id === cardId);
                if (card) return card;
            }
            return null;
        },
        clearAll() {
            this.columns = [
                { id: 1, max: Infinity, title: "Запланированные задачи", cardsTask: [] },
                { id: 2, max: Infinity, title: "В работе", cardsTask: [] },
                { id: 3, max: Infinity, title: "Тестирование", cardsTask: [] },
                { id: 4, max: Infinity, title: "Выполненные задачи", cardsTask: [] },
            ];
            this.save();
        },
    },
    mounted() {
        this.load();
    },
    template: `
  <div class="kanban-board">
    <h1>{{ titleBoard }}</h1>
    <div class="columns-container">
      <column-board
        v-for="column in columns"
        :key="column.id"
        :cards-task="column.cardsTask"
        :column-id="column.id"
        :columns="columns"
        :title="column.title"
        @move-card="handleMoveCard"
        @remove-card="removeCard"
        @update-card="handleUpdateCard"
        @return-card="handleReturnCard"
      />
    </div>
    <div class="controls">
      <button @click="clearAll" class="btn-clear">Удалить все задачи</button>
    </div>
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
    <div class="add-task-form">
      <h3>Добавить новую задачу</h3>
      <input
        v-model="title"
        type="text"
        placeholder="Заголовок задачи"
        class="input-title"
      />
      <textarea
        v-model="description"
        placeholder="Описание задачи"
        class="input-description"
      ></textarea>
      <input
        v-model="dateDeadLine"
        type="date"
        placeholder="Дедлайн"
        class="input-date"
      />
      <button @click="addTask" class="btn-add">Добавить задачу</button>
    </div>
  </div>
`,
};

createApp(KanbanBoard).mount('#app');