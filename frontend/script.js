// Função para exibir o formulário de cadastro de veículo
function mostrarFormularioCadastroVeiculo() {
    document.getElementById('formulario-veiculo').style.display = 'block';
    document.getElementById('formulario-checklist').style.display = 'none';
    document.getElementById('checklists-section').style.display = 'none';
    document.getElementById('detalhes-checklist-section').style.display = 'none'; // Esconde a página de detalhes
}

// Função para exibir o formulário de cadastro de checklist
function mostrarFormularioChecklist() {
    document.getElementById('formulario-veiculo').style.display = 'none';
    document.getElementById('formulario-checklist').style.display = 'block';
    document.getElementById('checklists-section').style.display = 'none';
    document.getElementById('detalhes-checklist-section').style.display = 'none'; // Esconde a página de detalhes

    // Carregar os veículos no formulário de cadastro de checklist
    loadVeiculos();
}

// Função para exibir a seção de checklists
function mostrarChecklists() {
    document.getElementById('formulario-veiculo').style.display = 'none';
    document.getElementById('formulario-checklist').style.display = 'none';
    document.getElementById('checklists-section').style.display = 'block';
    document.getElementById('detalhes-checklist-section').style.display = 'none'; // Esconde a página de detalhes

    // Carregar os veículos na seção de checklists
    loadVeiculos();
}

// Função para carregar a lista de veículos
function loadVeiculos() {
    fetch('http://localhost:3000/api/veiculos')
    .then(response => response.json())
    .then(veiculos => {
        const select = document.getElementById('id_veiculo');
        const veiculoSelect = document.getElementById('veiculo-select');
        select.innerHTML = ''; // Limpa as opções atuais
        veiculoSelect.innerHTML = ''; // Limpa as opções do select

        veiculos.forEach(veiculo => {
            const option = document.createElement('option');
            option.value = veiculo.id;
            option.textContent = `${veiculo.identificacao} - ${veiculo.placa} - ${veiculo.tipo}`;
            select.appendChild(option);
            veiculoSelect.appendChild(option.cloneNode(true)); // Adiciona ao segundo select
        });
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao carregar veículos');
    });
}

// Função para salvar um veículo
function salvarVeiculo() {
    const tipo = document.getElementById('tipo').value;
    const identificacao = document.getElementById('identificacao').value;
    const placa = document.getElementById('placa').value;

    if (!tipo || !identificacao || !placa) {
        alert('Todos os campos são obrigatórios!');
        return;
    }

    const veiculoData = { tipo, identificacao, placa };

    fetch('http://localhost:3000/api/veiculos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(veiculoData),
    })
    .then(response => response.json())
    .then(data => {
        alert('Veículo cadastrado com sucesso!');
        document.getElementById('formulario-veiculo').reset();
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao cadastrar o veículo');
    });
}

// Função para salvar um checklist
function salvarChecklist() {
    const id_veiculo = document.getElementById('id_veiculo').value;
    const observacoes = document.getElementById('observacoes').value;
    const mecanico = document.getElementById('mecanico').value;
    const arquivos = document.getElementById('arquivos').files;

    if (!id_veiculo || !observacoes || !mecanico || arquivos.length === 0) {
        alert('Todos os campos são obrigatórios!');
        return;
    }

    const formData = new FormData();
    formData.append('id_veiculo', id_veiculo);
    formData.append('observacoes', observacoes);
    formData.append('mecanico', mecanico);

    for (let i = 0; i < arquivos.length; i++) {
        console.log(`Adicionando arquivo: ${arquivos[i].name}`);  // Verifique o nome do arquivo no console
        formData.append('arquivos', arquivos[i]);
    }

    fetch('http://localhost:3000/api/checklists', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        alert('Checklist cadastrado com sucesso!');
        document.getElementById('formulario-checklist').reset();
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao cadastrar o checklist');
    });
}


// Função para carregar checklists ao selecionar um veículo
function carregarChecklists() {
    const id_veiculo = document.getElementById('veiculo-select').value;
    const checklistsContainer = document.getElementById('checklists-container');

    if (!id_veiculo) {
        checklistsContainer.innerHTML = '';
        return;
    }

    fetch(`http://localhost:3000/api/checklists/by-veiculo/${id_veiculo}`)
    .then(response => response.json())
    .then(checklists => {
        checklistsContainer.innerHTML = ''; // Limpa os checklists anteriores

        checklists.forEach(checklist => {
            const checklistDiv = document.createElement('div');
            checklistDiv.classList.add('checklist-item');
            checklistDiv.innerHTML = `
                <h3>Checklist - ${new Date(checklist.data).toLocaleString()}</h3>
                <button onclick="mostrarDetalhesChecklist(${checklist.id_checklist})">Ver Detalhes</button>
                <button onclick="deletarChecklist(${checklist.id_checklist})">Excluir Checklist</button>
            `;
            checklistsContainer.appendChild(checklistDiv);
        });
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao carregar os checklists');
    });
}

// Função para exibir os detalhes de um checklist
function mostrarDetalhesChecklist(id_checklist) {
    const detalhesContainer = document.getElementById('detalhes-checklist');
    const detalhesSection = document.getElementById('detalhes-checklist-section');

    if (detalhesSection.style.display === 'block') {
        detalhesSection.style.display = 'none';
    } else {
        fetch(`http://localhost:3000/api/checklists/detalhes/${id_checklist}`)
        .then(response => response.json())
        .then(detalhes => {
            console.log('Detalhes recebidos:', detalhes);  // Verifique os dados no log
            if (detalhes.message) {
                alert(detalhes.message);  // Caso o checklist não tenha sido encontrado
                return;
            }

            detalhesContainer.innerHTML = `
                <h3>Detalhes do Checklist</h3>
                <p><strong>Data e Hora:</strong> ${new Date(detalhes.data).toLocaleString()}</p>
                <p><strong>Mecânico:</strong> ${detalhes.mecanico}</p>
                <p><strong>Observações:</strong> ${detalhes.observacoes}</p>
                <h4>Imagens:</h4>
                <div id="imagens-checklist">
                    ${detalhes.arquivos.map(arquivo => {
                        if (arquivo.endsWith('.mp4')) {
                            // Exibe o vídeo se o arquivo for um .mp4
                            return `<video width="320" height="240" controls>
                                        <source src="http://localhost:3000${arquivo}" type="video/mp4">
                                        Seu navegador não suporta o formato de vídeo.
                                    </video>`;
                        } else {
                            // Exibe a imagem se o arquivo não for um vídeo
                            return `<img src="http://localhost:3000${arquivo}" alt="Imagem do Checklist" width="200">`;
                        }
                    }).join('')}
                </div>
            `;
            detalhesSection.style.display = 'block';
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar detalhes do checklist');
        });
    }
}

// Função para excluir um checklist
function deletarChecklist(id_checklist) {
    if (confirm('Tem certeza que deseja excluir este checklist?')) {
        fetch(`http://localhost:3000/api/checklists/${id_checklist}`, {
            method: 'DELETE', // Método DELETE para a rota de exclusão
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);  // Exibe uma mensagem caso a exclusão seja bem-sucedida
                carregarChecklists();  // Recarrega a lista de checklists após a exclusão
            } else {
                alert('Erro ao excluir o checklist');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao tentar excluir o checklist');
        });
    }
}
