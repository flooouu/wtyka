document.addEventListener('DOMContentLoaded', () => {
    // Funkcja usuwająca duplikaty linków
    function removeDuplicates(links) {
        const uniqueLinks = Array.from(new Set(links.map(link => link.url)))
            .map(url => links.find(link => link.url === url));
        return uniqueLinks;
    }

    // Funkcja do pobierania linków z bazy danych
    async function fetchLinks(sortBy = 'default') {
        try {
            let url = 'https://getlinks-z7s7pe3uva-uc.a.run.app';

            if (sortBy !== 'default') {
                url += `?sortBy=${sortBy.field}&sortOrder=${sortBy.order}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                console.warn(`Otrzymano nieoczekiwany status odpowiedzi: ${response.status}`);
                return;
            }

            const links = await response.json();
            console.log("Otrzymane dane z serwera:", links);

            if (!Array.isArray(links) || links.length === 0) {
                console.warn('Brak linków do wyświetlenia.');
                displayLinks([]);
                return;
            }

            const uniqueLinks = removeDuplicates(links);
            displayLinks(uniqueLinks);
        } catch (error) {
            console.error('Błąd podczas pobierania linków:', error.message);
        }
    }

    // Funkcja do wyświetlania linków na stronie
    function displayLinks(links) {
        const linkContainer = document.getElementById('linkContainer');
        linkContainer.innerHTML = '';

        links.forEach(link => {
            const linkElement = document.createElement('div');
            linkElement.innerHTML = `
                <span style="color: ${link.status === 'dobry' ? 'green' : 'red'}">
                    ${link.url}
                </span>
                <button class="edit-button" data-id="${link.id}" data-url="${link.url}" data-status="${link.status}">Edit</button>
            `;
            linkContainer.appendChild(linkElement);
        });

        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', () => {
                const id = button.getAttribute('data-id');
                const url = button.getAttribute('data-url');
                const status = button.getAttribute('data-status');
                showEditModal(id, url, status);
            });
        });
    }
    // Obsługuje sprawdzanie linku z uwzględnieniem checkboxa
document.getElementById('checkLink').addEventListener('click', async () => {
    const url = document.getElementById('checkUrl').value.trim();
    const useModel = document.getElementById('useModel').checked;

    // Sprawdzanie, czy URL jest podany
    if (!url) {
        document.getElementById('checkResult').innerText = 'Proszę podać adres URL.';
        document.getElementById('checkResult').style.display = 'block';
        return;
    }

    // Resetuj wynik i wyświetl komunikat ładowania
    document.getElementById('checkResult').innerText = 'Ładowanie...';
    document.getElementById('checkResult').style.display = 'block';
    document.getElementById('addToDatabase').style.display = 'none';

    const endpoint = useModel
        ? 'https://checklinkwithmodel-z7s7pe3uva-uc.a.run.app'
        : 'https://checklink-z7s7pe3uva-uc.a.run.app/checkLink';

    try {
        let response, data;
        if (useModel) {
            // Sprawdzanie za pomocą modelu (POST)
            response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) throw new Error('Błąd połączenia z modelem.');

            data = await response.json();

            const statusMessage = data.status === 'good' ? 'Link jest poprawny!' : 'Link jest niepoprawny!';
            const status = data.status === 'good' ? 'dobry' : 'podejrzany';

            // Wyświetlanie wyniku
            document.getElementById('checkResult').innerText = statusMessage;
            document.getElementById('checkResult').style.display = 'block';

            // Wyświetlanie przycisku dodawania do bazy
            const addToDatabaseButton = document.getElementById('addToDatabase');
            addToDatabaseButton.style.display = 'block';
            addToDatabaseButton.onclick = () => addLinkToDatabase(url, status);
        } else {
            // Sprawdzanie za pomocą prostego API (GET)
            response = await fetch(`${endpoint}?url=${encodeURIComponent(url)}`);
            if (response.ok) {
                data = await response.json();
                document.getElementById('checkResult').innerText = `Status: ${data.status}`;
            } else {
                const result = await response.text();
                document.getElementById('checkResult').innerText =
                    result === 'Link not found!' ? 'Nie ma go w bazie danych.' : result;
            }
        }
    } catch (error) {
        console.error('Błąd podczas sprawdzania linku:', error.message);
        document.getElementById('checkResult').innerText = 'Wystąpił błąd: ' + error.message;
    }
});


    // Wyświetlanie modala do edytowania linku
    function showEditModal(id, url, status) {
        const editModal = document.getElementById('editModal');
        document.getElementById('editUrl').value = url;
        document.getElementById('editStatus').value = status;
        editModal.style.display = 'block';

        document.getElementById('saveEdit').onclick = () => saveEditedLink(id);
        document.getElementById('deleteLink').onclick = () => {
            if (confirm("Czy na pewno chcesz usunąć ten link?")) {
                deleteLinkFromDatabase(id);
            }
        };
        document.getElementById('cancelEdit').onclick = () => {
            editModal.style.display = 'none';
        };
    }

    // Definicja resetAddLinkForm przed addLinkToDatabase
function resetAddLinkForm() {
    document.getElementById('manualUrlInput').value = ''; // Czyszczenie pola URL
    document.getElementById('manualStatusSelect').value = 'dobry'; // Resetowanie wyboru statusu
}

async function addLinkToDatabase(url, status) {
    const resultMessage = document.getElementById('resultMessage');
    try {
        console.log("Dodawanie linku:", { url, status });
        const response = await fetch('https://addlink-z7s7pe3uva-uc.a.run.app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, status }),
        });

        if (response.ok) {
            resultMessage.innerText = "Link został pomyślnie dodany do bazy danych!";
            resultMessage.style.color = "green";
            resultMessage.style.display = "block";
            fetchLinks(); // Odśwież listę linków
            resetAddLinkForm(); // Resetuj pola
        } else {
            const errorMessage = await response.text();
            resultMessage.innerText = `Błąd podczas dodawania linku: ${errorMessage}`;
            resultMessage.style.color = "red";
            resultMessage.style.display = "block";
        }
    } catch (error) {
        console.error('Błąd przy dodawaniu linku:', error);
        resultMessage.innerText = 'Wystąpił błąd podczas dodawania linku.';
        resultMessage.style.color = "red";
        resultMessage.style.display = "block";
    }
    setTimeout(() => {
        resultMessage.style.display = "none";
    }, 5000);
}




    // Resetowanie formularza dodawania linków
    function resetAddLinkForm() {
        document.getElementById('manualUrlInput').value = '';
        document.getElementById('manualStatusSelect').value = 'dobry';
    }

    // Obsługuje ręczne dodawanie linków
    document.getElementById('addLinkButton').addEventListener('click', () => {
        const url = document.getElementById('manualUrlInput').value.trim();
        const status = document.getElementById('manualStatusSelect').value;

        if (!url || !status) {
            alert("Proszę podać adres URL i status.");
            return;
        }

        addLinkToDatabase(url, status);
    });

    // Funkcja do zapisania edytowanego linku
    async function saveEditedLink(id) {
    const resultMessage = document.getElementById('resultMessage'); // Element do wyświetlania komunikatów
    const newUrl = document.getElementById('editUrl').value.trim();
    const newStatus = document.getElementById('editStatus').value;

    const updatedData = { id, url: newUrl, status: newStatus };

    try {
        const response = await fetch('https://editlink-z7s7pe3uva-uc.a.run.app', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            resultMessage.innerText = "Link został pomyślnie zaktualizowany!";
            resultMessage.style.color = "green"; // Kolor sukcesu
            resultMessage.style.display = "block";
            fetchLinks(); // Odśwież listę linków po edytowaniu
            document.getElementById('editModal').style.display = 'none'; // Zamknij modal
        } else {
            const errorMessage = await response.text();
            resultMessage.innerText = `Błąd podczas edytowania linku: ${errorMessage}`;
            resultMessage.style.color = "red"; // Kolor błędu
            resultMessage.style.display = "block";
        }
    } catch (error) {
        console.error('Błąd przy edytowaniu linku:', error);
        resultMessage.innerText = 'Wystąpił błąd podczas edytowania linku.';
        resultMessage.style.color = "red"; // Kolor błędu
        resultMessage.style.display = "block";
    }

    // Ukryj komunikat po 5 sekundach
    setTimeout(() => {
        resultMessage.style.display = "none";
    }, 5000);
}
// Funkcja do usuwania linku
async function deleteLinkFromDatabase(id) {
    const resultMessage = document.getElementById('resultMessage'); // Element do wyświetlania komunikatów
    const confirmMessage = document.getElementById('confirmMessage'); // Element do potwierdzania usunięcia

    // Wyświetlanie potwierdzenia usunięcia
    confirmMessage.style.display = 'block';
    confirmMessage.innerHTML = `
        <p>Czy na pewno chcesz usunąć ten link?</p>
        <button id="confirmDelete" style="margin-right: 10px;">Tak</button>
        <button id="cancelDelete">Nie</button>
    `;

    document.getElementById('confirmDelete').onclick = async () => {
        try {
            const response = await fetch('https://deletelink-z7s7pe3uva-uc.a.run.app', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });

            if (response.ok) {
                resultMessage.innerText = "Link został usunięty z bazy danych!";
                resultMessage.style.color = "green"; // Kolor sukcesu
                resultMessage.style.display = "block";
                fetchLinks(); // Odśwież listę linków
            } else {
                const errorMessage = await response.text();
                resultMessage.innerText = `Błąd podczas usuwania linku: ${errorMessage}`;
                resultMessage.style.color = "red"; // Kolor błędu
                resultMessage.style.display = "block";
            }
        } catch (error) {
            console.error('Błąd przy usuwaniu linku:', error);
            resultMessage.innerText = 'Wystąpił błąd podczas usuwania linku.';
            resultMessage.style.color = "red"; // Kolor błędu
            resultMessage.style.display = "block";
        }

        confirmMessage.style.display = 'none'; // Ukryj komunikat potwierdzenia
    };

    document.getElementById('cancelDelete').onclick = () => {
        confirmMessage.style.display = 'none'; // Ukryj komunikat potwierdzenia
    };
    // Ukryj komunikat po 5 sekundach
    setTimeout(() => {
        resultMessage.style.display = "none";
    }, 5000);
}
// Funkcja do sortowania linków
document.getElementById('sortOptions').addEventListener('change', async () => {
    const sortBy = document.getElementById('sortOptions').value;

    let sortParams = {};
    if (sortBy === 'status') {
        sortParams = { field: 'status', order: 'asc' }; // Sortowanie po statusie rosnąco
    } else if (sortBy === 'timestamp') {
        sortParams = { field: 'timestamp', order: 'desc' }; // Sortowanie po dacie malejąco
    } else {
        sortParams = 'default'; 
    }

    await fetchLinks(sortParams); 
});


    // Inicjalizacja
    fetchLinks();
});
