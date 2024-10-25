document.addEventListener('DOMContentLoaded', () => {
    // Элементы формы и превью
    const form = document.getElementById('card-form');
    const cardPreviewFront = document.getElementById('card-preview-front');
    const cardPreviewBack = document.getElementById('card-preview-back');
    const downloadBtn = document.getElementById('download-pdf');
    const addPhoneBtn = document.querySelector('.add-phone');
    const phoneContainer = document.getElementById('phone-container');
    const showEmailCheckbox = document.getElementById('showEmail');
    const emailContainer = document.getElementById('email-container');
    const showAddressCheckbox = document.getElementById('showAddress');
    const addressContainer = document.getElementById('address-container');
    const logoUpload = document.getElementById('logoUpload');
    const logoPlacementSelect = document.getElementById('logoPlacement');
    const logoPositionContainer = document.getElementById('logo-position-container');
    const logoSizeContainer = document.getElementById('logo-size-container');
    const logoSizeInput = document.getElementById('logoSize');
    const warningMessage = document.getElementById('warning-message');

    // Инициализация Sortable.js для изменения порядка полей
    const fieldOrderList = document.getElementById('field-order');
    const sortable = Sortable.create(fieldOrderList, {
        animation: 150,
        onSort: () => {
            renderCard();
        },
    });

    // Показать/скрыть поле Email
    showEmailCheckbox.addEventListener('change', () => {
        emailContainer.style.display = showEmailCheckbox.checked ? 'block' : 'none';
        renderCard();
    });

    // Показать/скрыть поле адреса
    showAddressCheckbox.addEventListener('change', () => {
        addressContainer.style.display = showAddressCheckbox.checked ? 'block' : 'none';
        renderCard();
    });

    // Добавление дополнительного поля для телефона
    addPhoneBtn.addEventListener('click', () => {
        const inputGroup = document.createElement('div');
        inputGroup.classList.add('input-group', 'mb-2');
        inputGroup.innerHTML = `
            <input type="text" class="form-control phone-input" placeholder="+7 (999) 123-45-67">
            <button class="btn btn-outline-secondary remove-phone" type="button"><i class="bi bi-dash"></i></button>
        `;
        phoneContainer.appendChild(inputGroup);

        // Удаление поля телефона
        inputGroup.querySelector('.remove-phone').addEventListener('click', () => {
            inputGroup.remove();
            renderCard();
        });

        // Инициализация маскирования для нового поля
        initializePhoneInput(inputGroup.querySelector('.phone-input'));
    });

    // Инициализация маскирования для существующих полей телефона
    document.querySelectorAll('.phone-input').forEach(input => {
        initializePhoneInput(input);
    });

    // Функция инициализации маскирования телефона
    function initializePhoneInput(input) {
        input.addEventListener('input', () => {
            let value = input.value.replace(/\D/g, '');
            if (value.startsWith('8')) {
                value = '7' + value.slice(1);
            }
            input.value = formatPhoneNumber(value);
            renderCard();
        });

        // Выделение текста при фокусе на поле
        input.addEventListener('focus', () => {
            input.select();
        });
    }

    // Функция форматирования номера телефона
    function formatPhoneNumber(value) {
        let formatted = '+';
        if (value.length > 0) {
            formatted += value.substring(0, 1);
        }
        if (value.length > 1) {
            formatted += ' (' + value.substring(1, 4);
        }
        if (value.length >= 4) {
            formatted += ') ' + value.substring(4, 7);
        }
        if (value.length >= 7) {
            formatted += '-' + value.substring(7, 9);
        }
        if (value.length >= 9) {
            formatted += '-' + value.substring(9, 11);
        }
        return formatted;
    }

    // Обработка загрузки логотипа
    logoUpload.addEventListener('change', () => {
        const file = logoUpload.files[0];
        if (file) {
            const fileType = file.type;
            if (fileType !== 'image/png' && fileType !== 'image/svg+xml') {
                alert('Пожалуйста, загрузите файл в формате PNG или SVG.');
                logoUpload.value = '';
                logoPositionContainer.style.display = 'none';
                logoSizeContainer.style.display = 'none';
            } else {
                if (logoPlacementSelect.value === 'back') {
                    logoPositionContainer.style.display = 'none';
                    logoSizeContainer.style.display = 'block';
                } else {
                    logoPositionContainer.style.display = 'block';
                    logoSizeContainer.style.display = 'none';
                }
            }
        } else {
            logoPositionContainer.style.display = 'none';
            logoSizeContainer.style.display = 'none';
        }
        renderCard();
    });

    // Обработка изменения размещения логотипа
    logoPlacementSelect.addEventListener('change', () => {
        if (logoPlacementSelect.value === 'back') {
            logoPositionContainer.style.display = 'none';
            logoSizeContainer.style.display = 'block';
        } else {
            logoPositionContainer.style.display = 'block';
            logoSizeContainer.style.display = 'none';
        }
        renderCard();
    });

    // Обработка изменения размера логотипа на обратной стороне
    logoSizeInput.addEventListener('input', () => {
        renderCard();
    });

    // Добавление обработчиков событий для live-обновления визитки
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        if (input.type === 'file' || input.type === 'checkbox' || input.type === 'radio') {
            input.addEventListener('change', () => {
                renderCard();
            });
        } else {
            input.addEventListener('input', () => {
                renderCard();
            });
        }

        // Выделение текста при фокусе на поле
        if (input.type === 'text' || input.type === 'email') {
            input.addEventListener('focus', () => {
                input.select();
            });
        }
    });

    // Предотвращение отправки формы при нажатии Enter
    form.addEventListener('submit', (e) => {
        e.preventDefault();
    });

    // Функция рендеринга визитки
    function renderCard() {
        // Получение данных из формы
        const organizationInput = document.getElementById('organization');
        const organization = organizationInput.value || organizationInput.placeholder;

        const fullNameInput = document.getElementById('fullName');
        const fullName = fullNameInput.value || fullNameInput.placeholder;

        const positionInput = document.getElementById('position');
        const position = positionInput.value || positionInput.placeholder;

        const phoneInputs = document.querySelectorAll('.phone-input');
        const phones = Array.from(phoneInputs).map(input => input.value || input.placeholder);

        const emailInput = document.getElementById('email');
        const email = emailInput.value || emailInput.placeholder;

        const addressInput = document.getElementById('address');
        const address = addressInput.value || addressInput.placeholder;

        const showEmail = document.getElementById('showEmail').checked;
        const showAddress = document.getElementById('showAddress').checked;
        const cardSize = document.getElementById('card-size').value;
        const textAlign = document.querySelector('input[name="textAlign"]:checked').value;
        const fontSize = document.getElementById('fontSize').value + 'px';
        const backgroundColor = document.getElementById('backgroundColor').value;
        const borderRadius = document.getElementById('borderRadius').value + 'px';

        // Очистка превью
        cardPreviewFront.innerHTML = '';
        cardPreviewBack.innerHTML = '';
        warningMessage.textContent = '';

        // Установка размера и стилей визитки
        const [width, height] = cardSize.split('x').map(value => parseInt(value));
        [cardPreviewFront, cardPreviewBack].forEach(preview => {
            preview.style.width = width + 'px';
            preview.style.height = height + 'px';
            preview.style.backgroundColor = backgroundColor;
            preview.style.borderRadius = borderRadius;
        });

        // Создание элементов
        const elements = {
            organization: createTextElement('organization', organization, textAlign, fontSize),
            fullName: createTextElement('fullName', fullName, textAlign, fontSize),
            position: createTextElement('position', position, textAlign, fontSize),
            contactInfo: createContactInfo(phones, email, address, showEmail, showAddress, textAlign, fontSize)
        };

        // Рендеринг полей на лицевой стороне в соответствии с порядком
        const fieldOrder = Array.from(fieldOrderList.children).map(li => li.getAttribute('data-field'));
        fieldOrder.forEach(field => {
            if (elements[field]) {
                cardPreviewFront.appendChild(elements[field]);
            }
        });

        // Добавление логотипа
        handleLogoRendering();

        // Проверка на переполнение
        checkOverflow();
    }

    // Функция создания текстового элемента
    function createTextElement(className, text, textAlign, fontSize) {
        const element = document.createElement('div');
        element.classList.add(className);
        element.textContent = text;
        element.style.textAlign = textAlign;
        element.style.fontSize = fontSize;
        element.style.wordWrap = 'break-word';
        return element;
    }

    // Функция создания блока контактной информации
    function createContactInfo(phones, email, address, showEmail, showAddress, textAlign, fontSize) {
        const contactInfoContainer = document.createElement('div');
        contactInfoContainer.classList.add('contact-info-container');
        contactInfoContainer.style.textAlign = textAlign;
        contactInfoContainer.style.fontSize = fontSize;

        phones.forEach(phone => {
            if (phone) {
                const phoneElement = document.createElement('div');
                phoneElement.textContent = phone;
                contactInfoContainer.appendChild(phoneElement);
            }
        });

        if (showEmail && email) {
            const emailElement = document.createElement('div');
            emailElement.textContent = email;
            contactInfoContainer.appendChild(emailElement);
        }

        if (showAddress && address) {
            const addressElement = document.createElement('div');
            addressElement.textContent = address;
            contactInfoContainer.appendChild(addressElement);
        }

        return contactInfoContainer;
    }

    // Функция обработки логотипа
    function handleLogoRendering() {
        if (logoUpload.files && logoUpload.files[0]) {
            const logoElement = document.createElement('img');
            const file = logoUpload.files[0];
            const reader = new FileReader();

            reader.onload = function(e) {
                logoElement.src = e.target.result;

                if (logoPlacementSelect.value === 'back') {
                    // Логотип на обратной стороне
                    logoElement.classList.add('logo-back');
                    const logoSize = logoSizeInput.value + 'px';
                    logoElement.style.width = logoSize;
                    logoElement.style.height = 'auto';
                    cardPreviewBack.appendChild(logoElement);
                    cardPreviewBack.style.display = 'inline-block';
                } else {
                    // Логотип на лицевой стороне
                    logoElement.classList.add('logo');
                    // Установка позиции
                    const logoPosition = document.getElementById('logoPosition').value;
                    logoElement.style.position = 'absolute';
                    logoElement.style.maxWidth = '80px';
                    logoElement.style.maxHeight = '80px';

                    switch (logoPosition) {
                        case 'top-left':
                            logoElement.style.top = '20px';
                            logoElement.style.left = '20px';
                            break;
                        case 'top-right':
                            logoElement.style.top = '20px';
                            logoElement.style.right = '20px';
                            break;
                        case 'bottom-left':
                            logoElement.style.bottom = '20px';
                            logoElement.style.left = '20px';
                            break;
                        case 'bottom-right':
                            logoElement.style.bottom = '20px';
                            logoElement.style.right = '20px';
                            break;
                    }
                    cardPreviewFront.appendChild(logoElement);

                    // Проверка на перекрытие логотипа с текстом
                    checkLogoOverlap(logoElement);
                }

                // Проверка на переполнение
                checkOverflow();
            };

            reader.readAsDataURL(file);
        } else {
            // Если логотип не загружен
            cardPreviewBack.innerHTML = '';
            cardPreviewBack.style.display = 'inline-block'; // Отображаем пустую обратную сторону
        }
    }

    // Функция проверки переполнения контента
    function checkOverflow() {
        const isOverflowingFront = cardPreviewFront.scrollHeight > cardPreviewFront.clientHeight || cardPreviewFront.scrollWidth > cardPreviewFront.clientWidth;
        const isOverflowingBack = cardPreviewBack.scrollHeight > cardPreviewBack.clientHeight || cardPreviewBack.scrollWidth > cardPreviewBack.clientWidth;

        if (isOverflowingFront || isOverflowingBack) {
            warningMessage.textContent = 'Внимание: Контент визитки выходит за пределы. Пожалуйста, уменьшите размер текста или количество информации.';
        } else {
            warningMessage.textContent = '';
        }
    }

    // Функция проверки перекрытия логотипа с текстом
    function checkLogoOverlap(logoElement) {
        const logoRect = logoElement.getBoundingClientRect();
        const textElements = cardPreviewFront.querySelectorAll('.organization, .fullName, .position, .contact-info-container');

        let isOverlapping = false;
        textElements.forEach(textElement => {
            const textRect = textElement.getBoundingClientRect();
            if (!(logoRect.right < textRect.left ||
                  logoRect.left > textRect.right ||
                  logoRect.bottom < textRect.top ||
                  logoRect.top > textRect.bottom)) {
                isOverlapping = true;
            }
        });

        if (isOverlapping) {
            warningMessage.textContent = 'Внимание: Логотип перекрывает текст на визитке. Пожалуйста, измените позицию логотипа или уменьшите его размер.';
        }
    }

    // Функция ожидания загрузки изображений
    function waitForImagesToLoad(container) {
        const images = container.getElementsByTagName('img');
        const promises = [];

        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            if (!img.complete) {
                promises.push(new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                }));
            }
        }

        return Promise.all(promises);
    }

    // Скачивание визитки в PDF
    downloadBtn.addEventListener('click', () => {
        // Ожидание загрузки изображений перед рендерингом
        Promise.all([
            waitForImagesToLoad(cardPreviewFront),
            waitForImagesToLoad(cardPreviewBack)
        ]).then(() => {
            // Создаем массив для хранения обещаний (promises) от html2canvas
            const canvasPromises = [
                html2canvas(cardPreviewFront, { scale: 2 }),
                html2canvas(cardPreviewBack, { scale: 2 })
            ];

            Promise.all(canvasPromises).then(canvases => {
                const pdfWidth = cardPreviewFront.offsetWidth; // Используем пиксели
                const pdfHeight = cardPreviewFront.offsetHeight;

                const pdf = new jspdf.jsPDF('landscape', 'px', [pdfWidth, pdfHeight]);

                const imgDataFront = canvases[0].toDataURL('image/png');
                pdf.addImage(imgDataFront, 'PNG', 0, 0, pdfWidth, pdfHeight);

                const imgDataBack = canvases[1].toDataURL('image/png');
                pdf.addPage();
                pdf.addImage(imgDataBack, 'PNG', 0, 0, pdfWidth, pdfHeight);

                pdf.save('визитка.pdf');
            });
        }).catch(error => {
            console.error('Ошибка при загрузке изображений:', error);
            alert('Произошла ошибка при загрузке изображений. Пожалуйста, попробуйте ещё раз.');
        });
    });

    // Инициализация: рендеринг визитки при загрузке страницы
    renderCard();
});
