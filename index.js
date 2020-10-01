(() => {
  const STATE_DONE = 1;
  const STATE_PENDING = 4;
  const STATE_WORKING = 2;
  const STATE_STORE = 3;
  const STATE_IGNORED = 0;

  const appCategories = [
    { name: 'Archive', type: STATE_IGNORED },
    { name: 'Done', type: STATE_DONE },
    { name: 'ToDo', type: STATE_PENDING},
    { name: 'Store', type: STATE_STORE },
    { name: 'WFR', type: STATE_DONE },
    { name: 'Working', type: STATE_WORKING },
  ];


  const appWording = [
    { type: STATE_PENDING, title: 'Travail en cours' },
    { type: STATE_WORKING, title: 'Travail à faire' },
    { type: STATE_DONE, title: 'Travail réalisé' },
    { type: STATE_STORE, title: 'Boutiques' },
    
  ];

  const cat = {
    pending: { type: STATE_PENDING, list: [] },
    working: { type: STATE_WORKING, list: [] },
    done: { type: STATE_DONE, list: [] },
    store: { type: STATE_STORE, list: [] },
    ignored: { type: STATE_IGNORED, list: [] },
  };

  const cleanContent = (content) => {
    delete content.assignees;
    delete content.attachments;
    delete content.members;
    delete content.milestones;
    delete content.task_labels;
    delete content.task_types;
    delete content.timer;
    delete content.project;
    delete content.labels;

    return content;
  }

  const prepare = (lists) => appCategories.every((category) => {
    const list = lists.find(({ title }) => title === category.name)
    
    switch (category.type) {
      case STATE_PENDING:
        cat.pending.list.push(list.id);
        break;
      case STATE_WORKING:
        cat.working.list.push(list.id);
        break;
      case STATE_DONE:
        cat.done.list.push(list.id);
        break;
      case STATE_STORE:
        cat.store.list.push(list.id);
        break;
      case STATE_IGNORED:
        cat.ignored.list.push(list.id);
        break;
    }

    return true;
  });
  

  const computeOrder = (listId, cat) => {
    if (cat.pending.list.includes(listId)) { return STATE_PENDING; }
    if (cat.working.list.includes(listId)) { return STATE_WORKING; }
    if (cat.done.list.includes(listId)) { return STATE_DONE; }
    if (cat.store.list.includes(listId)) { return STATE_STORE; }
  }

  const parseFile = (fileContent) => {
    const { lists, tasks } = JSON.parse(fileContent);
    prepare(lists)

    let currentListId = 0;
    const content = tasks.filter(task => ! cat.ignored.list.includes(task.list_id))
                          .map(({ title, description, list_id }) => ({
                            title,
                            description,
                            order: computeOrder(list_id, cat)
                          }))
                          .sort((task1, task2) => (task1.order - task2.order))
                          .reduce((acc, task) => {
                            if (task.order !== currentListId) {
                              currentListId = task.order;
                              acc += `\r\n\r\n# ${appWording.find(cat => cat.type === task.order).title}`;
                            }
                            return acc + `\r\n\r\n## ${task.title}\r\n${task.description}`
                          }, '');
    
    document.getElementById('inputfile').style.display = 'none';
    document.getElementById('render').innerHTML = marked(content);
  }

  document.getElementById('inputfile').addEventListener('change', function (event) { 
        
      const fr = new FileReader(); 
      fr.onload = () => parseFile(fr.result);
      fr.readAsText(this.files[0]); 
  }) 
})()