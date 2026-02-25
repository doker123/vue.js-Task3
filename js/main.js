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
    emits: ['update-card', 'remove-card', 'move-card', 'return-card', 'archive-card', 'drag-start', 'drag-end', 'drag-over', 'drop'],
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
            return cid !== 4 && cid !== 5 && this.getColumnIndex(cid) > 0;
        },
        canMoveForward() {
            if (!this.availableColumns) return false;
            const cid = Number(this.columnId);
            const currentIndex = this.getColumnIndex(cid);
            return currentIndex < this.availableColumns.length - 1;
        },
        isDraggable() {
            return !this.isEditing;
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


            if (this.columnId === 4) {
                const reason = prompt('Укажите причину возврата в тестирование:');
                if (reason === null || reason.trim() === '') return;
                this.$emit('return-card', {
                    cardId: this.card.id,
                    reason: reason.trim(),
                    targetColumnId: 3
                });
                return;
            }


            if (this.columnId === 3) {
                const reason = prompt('Укажите причину возврата в работу:');
                if (reason === null || reason.trim() === '') return;
                this.$emit('return-card', {
                    cardId: this.card.id,
                    reason: reason.trim(),
                    targetColumnId: 2
                });
                return;
            }


            if (this.columnId === 5) {
                const reason = prompt('Укажите причину возврата в тестирование:');
                if (reason === null || reason.trim() === '') return;
                this.$emit('return-card', {
                    cardId: this.card.id,
                    reason: reason.trim(),
                    targetColumnId: 3
                });
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
        archiveCard() {
            this.$emit('archive-card', this.card.id);
        },
        onDragStart(event) {
            event.dataTransfer.setData('text/plain', JSON.stringify({
                cardId: this.card.id,
                sourceColumnId: this.columnId
            }));
            event.dataTransfer.effectAllowed = 'move';
            this.$emit('drag-start', this.card.id);
        },
        onDragEnd() {
            this.$emit('drag-end');
        },
        getColumnIndex(columnId) {
            if (!this.availableColumns) return -1;
            return this.availableColumns.findIndex(col => col.id === columnId);
        }
    },
    template: `
  <div 
    class="task-card" 
    :class="{ dragging: isDragging, editing: isEditing }"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
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
          v-if="columnId === 4"
          @click="archiveCard"
          class="btn-action btn-archive"
          title="Архивировать карточку"
        >
          📦
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
        :disabled="columnId === 5 || columnId === 6 || getColumnIndex(columnId) <= 0"
        title="Переместить в предыдущую колонку"
      >
        ◀️
      </button>
      <button
        @click="moveForward"
        class="btn-move btn-forward"
        :disabled="columnId === 5 || columnId === 6"
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
        },
        isArchive: {
            type: Boolean,
            default: false
        }
    },
    emits: ['move-card', 'remove-card', 'update-card', 'return-card', 'archive-card', 'drop-card'],
    data() {
        return {
            isDragOver: false
        };
    },
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
        handleArchiveCard(cardId) {
            console.log('[columnBoard] archive-card received:', cardId);
            this.$emit('archive-card', cardId);
        },
        handleDragOver(event) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            this.isDragOver = true;
        },
        handleDragLeave() {
            this.isDragOver = false;
        },
        handleDrop(event) {
            event.preventDefault();
            this.isDragOver = false;
            
            const data = event.dataTransfer.getData('text/plain');
            if (!data) return;
            
            try {
                const { cardId, sourceColumnId } = JSON.parse(data);
                this.$emit('drop-card', {
                    cardId,
                    sourceColumnId,
                    targetColumnId: this.columnId
                });
            } catch (e) {
                console.error('[columnBoard] Error parsing drop data:', e);
            }
        },
        handleColumnBack() {
            alert('Массовый возврат всех задач из тестирования в работу');
        }
    },
    template: `
  <div
    class="kanban-column"
    :class="{ active: isDragOver }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <h3 class="column-title" :class="{ overdue: columnId === 5, archive: columnId === 6 }">{{ title }}</h3>
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
      @archive-card="handleArchiveCard"
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
                { id: 5, max: Infinity, title: "Просроченные задачи", cardsTask: [] },
                { id: 6, max: Infinity, title: "Архив", cardsTask: [] },
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
            const defaultColumns = [
                { id: 1, max: Infinity, title: "Запланированные задачи", cardsTask: [] },
                { id: 2, max: Infinity, title: "В работе", cardsTask: [] },
                { id: 3, max: Infinity, title: "Тестирование", cardsTask: [] },
                { id: 4, max: Infinity, title: "Выполненные задачи", cardsTask: [] },
                { id: 5, max: Infinity, title: "Просроченные задачи", cardsTask: [] },
                { id: 6, max: Infinity, title: "Архив", cardsTask: [] },
            ];
            
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (Array.isArray(parsed) && parsed.length >= 6) {
                        this.columns = parsed;
                    } else if (Array.isArray(parsed) && parsed.length > 0) {
                        this.columns = defaultColumns.map(col => {
                            const existing = parsed.find(c => c.id === col.id);
                            return existing || col;
                        });
                        this.save();
                    } else {
                        this.columns = defaultColumns;
                        this.save();
                    }
                } catch (e) {
                    console.error('Error loading from localStorage:', e);
                    this.columns = defaultColumns;
                    this.save();
                }
            } else {
                this.columns = defaultColumns;
                this.save();
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
                lastEditedAt: Date.now(),
                isOverdue: false
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
        checkOverdueCards() {
            const now = Date.now();
            this.columns.forEach(column => {
                column.cardsTask.forEach(card => {
                    if (card.dateDeadLine && card.dateDeadLine < now && !card.completedAt) {
                        card.isOverdue = true;
                    }
                });
            });
        },
        moveOverdueToSpecialColumn() {
            const now = Date.now();
            const performedColumn = this.columns.find(col => col.id === 4);
            const testingColumn = this.columns.find(col => col.id === 3);
            const overdueColumn = this.columns.find(col => col.id === 5);

            if (!performedColumn || !overdueColumn || !testingColumn) return;

            const cardsToMove = [];
            

            performedColumn.cardsTask.forEach(card => {
                if (card.dateDeadLine && card.dateDeadLine < now) {
                    card.isOverdue = true;
                    cardsToMove.push(card);
                }
            });

            testingColumn.cardsTask.forEach(card => {
                if (card.dateDeadLine && card.dateDeadLine < now) {
                    card.isOverdue = true;
                    cardsToMove.push(card);
                }
            });

            cardsToMove.forEach(card => {
                for (const column of this.columns) {
                    const index = column.cardsTask.findIndex(c => c.id === card.id);
                    if (index !== -1) {
                        column.cardsTask.splice(index, 1);
                        break;
                    }
                }
                if (!overdueColumn.cardsTask.some(c => c.id === card.id)) {
                    overdueColumn.cardsTask.push(card);
                }
            });

            if (cardsToMove.length > 0) {
                this.save();
            }
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

            if (currentColumnIndex === 3 && targetColumnIndex === 2) {
                console.warn('Перемещение запрещён: из Выполненных в Тестирование');
                return;
            }

            if (currentColumnIndex === 2 && targetColumnIndex === 1) {
                console.warn('Перемещение запрещён: из Тестирования в В работе');
                return;
            }

            if (targetColumnIndex === 3) {
                const now = Date.now();
                card.isOverdue = card.dateDeadLine && card.dateDeadLine < now;
                card.completedAt = now;
                card.reasonsForTheRefund = null;
            } else if (currentColumnIndex === 3) {
                card.isOverdue = false;
                card.completedAt = null;
            }
            

            if (currentColumnIndex === 2 && targetColumnIndex === 3 && card.isOverdue) {
                targetColumnIndex = 4;
            }

            this.moveToColumn(card, this.columns[targetColumnIndex].id);
        },
        handleReturnCard({ cardId, reason, targetColumnId }) {
            console.log('[KanbanBoard] returnCard called:', { cardId, reason, targetColumnId });
            const card = this.findCardById(cardId);
            if (!card) return;


            const sourceColumn = this.columns.find(col =>
                col.cardsTask.some(c => c.id === cardId)
            );
            let fullReason = reason;
            if (sourceColumn) {
                if (sourceColumn.id === 4 && targetColumnId === 3) {
                    fullReason = `[Из Выполненных в Тестирование] ${reason}`;
                } else if (sourceColumn.id === 3 && targetColumnId === 2) {
                    fullReason = `[Из Тестирования в В работу] ${reason}`;
                } else if (sourceColumn.id === 5 && targetColumnId === 3) {
                    fullReason = `[Из Просроченных в Тестирование] ${reason}`;
                }
            }

            card.reasonsForTheRefund = fullReason;
            card.completedAt = null;
            card.isOverdue = false;
            card.lastEditedAt = Date.now();
            this.moveToColumn(card, targetColumnId);
        },
        handleArchiveCard(cardId) {
            console.log('[KanbanBoard] archiveCard called:', cardId);
            const card = this.findCardById(cardId);
            if (!card) return;
            this.moveToColumn(card, 6);
        },
        handleDropCard({ cardId, sourceColumnId, targetColumnId }) {
            console.log('[KanbanBoard] dropCard called:', { cardId, sourceColumnId, targetColumnId });
            const card = this.findCardById(cardId);
            if (!card) return;

            if (sourceColumnId === targetColumnId) return;


            if (sourceColumnId === 4 && targetColumnId === 3) {
                console.warn('Drag-n-drop запрещён: из Выполненных в Тестирование');
                return;
            }


            if (sourceColumnId === 3 && targetColumnId === 2) {
                console.warn('Drag-n-drop запрещён: из Тестирования в В работе');
                return;
            }

            if (targetColumnId === 3) {
                const now = Date.now();
                card.isOverdue = card.dateDeadLine && card.dateDeadLine < now;
                card.completedAt = now;
                card.reasonsForTheRefund = null;

                if (card.isOverdue) {
                    targetColumnId = 5;
                }
            } else if (sourceColumnId === 3 && targetColumnId !== 4) {
                card.isOverdue = false;
                card.completedAt = null;
            }

            if (targetColumnId === 4 && card.dateDeadLine && card.dateDeadLine < Date.now()) {
                card.isOverdue = true;
            }

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
                { id: 5, max: Infinity, title: "Просроченные задачи", cardsTask: [] },
                { id: 6, max: Infinity, title: "Архив", cardsTask: [] },
            ];
            this.save();
        },
    },
    mounted() {
        this.load();
        this.moveOverdueToSpecialColumn();
        setInterval(() => {
            this.moveOverdueToSpecialColumn();
        }, 60000);
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
        @archive-card="handleArchiveCard"
        @drop-card="handleDropCard"
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