const searchInput = document.getElementById('searchInput');
const autocompleteList = document.getElementById('autocompleteList');
const repoList = document.getElementById('repoList');

let currentController = null; // Для управления текущим запросом

// Задержка запроса
function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

// Функция для поиска репозиториев с отменой предыдущего запроса
async function searchRepositories(query) {
    if (!query) return;

    // Отменяем предыдущий запрос, если он существует
    if (currentController) currentController.abort();
    currentController = new AbortController();
    const { signal } = currentController;

    try {
        const response = await fetch(`https://api.github.com/search/repositories?q=${query}&per_page=5`, { signal });

        if (!response.ok) {
            throw new Error(`GitHub API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.items;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Запрос был отменен');
        } else {
            console.error('Ошибка при получении репозиториев:', error);
        }
        return [];
    }
}

// Функция для отображения автокомплита
async function showAutocomplete(query) {
    autocompleteList.innerHTML = '';
    if (!query) return;

    const repos = await searchRepositories(query);

    if (!repos || repos.length === 0) {
        const noResultsItem = document.createElement('li');
        noResultsItem.textContent = 'No results found';
        autocompleteList.appendChild(noResultsItem);
        return;
    }

    repos.slice(0, 5).forEach(repo => { // Ограничиваем вывод 5 результатами
        const item = document.createElement('li');
        item.classList.add('autocomplete-item');
        item.textContent = repo.name;
        item.addEventListener('click', () => addRepository(repo));
        autocompleteList.appendChild(item);
    });
}

// Функция для добавления репозитория в список
function addRepository(repo) {
    const repoItem = document.createElement('li');
    repoItem.classList.add('repo-item');
    repoItem.innerHTML = `name: ${repo.name} <br> owner: ${repo.owner.login} <br> ⭐ ${repo.stargazers_count}`;

    // Кнопка удаления
    const deleteBtn = document.createElement('span');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.textContent = '❌';
    deleteBtn.addEventListener('click', () => repoItem.remove());

    repoItem.appendChild(deleteBtn);
    repoList.appendChild(repoItem);

    // Очистка поля ввода и скрытие автокомплита
    searchInput.value = '';
    autocompleteList.innerHTML = '';
}

// Обработка ввода с debounce
searchInput.addEventListener('input', debounce((event) => {
    const query = event.target.value.trim();
    if (query) {
        showAutocomplete(query);
    } else {
        autocompleteList.innerHTML = '';
    }
}, 900));
