document.addEventListener('DOMContentLoaded', function() {
    // Elementos da página
    const profileStep = document.getElementById('step-profile');
    const loginStep = document.getElementById('step-login');
    const profileCards = document.querySelectorAll('.profile-card');
    const backButton = document.getElementById('back-button');
    const loginForm = document.getElementById('login-form');
    const profileTitle = document.getElementById('profile-title');
    const profileSubtitle = document.getElementById('profile-subtitle');
    const profileIconDisplay = document.getElementById('profile-icon-display');
    const togglePasswordBtn = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');

    // Verificar se estamos na página de login
    const isLoginPage = profileStep && loginStep && profileCards.length > 0;
    
    // Se não estivermos na página de login, não execute o código específico de login
    if (!isLoginPage) {
        console.log("Não estamos na página de login, pulando inicialização específica de login");
        return;
    }

    // Mapeamento de perfis para seus dados
    const profileData = {
        'escola': {
            title: 'Login Administrativo',
            subtitle: 'Acesso exclusivo para administração escolar',
            icon: '<i class="fas fa-school fa-3x text-primary"></i>',
            redirectURL: 'escola-dashboard.html'
        },
        'professor': {
            title: 'Login de Professor',
            subtitle: 'Acesso para professores cadastrados',
            icon: '<i class="fas fa-chalkboard-teacher fa-3x text-success"></i>',
            redirectURL: 'professor-dashboard.html'
        },
        'pai': {
            title: 'Login de Responsável',
            subtitle: 'Acesso para pais e responsáveis',
            icon: '<i class="fas fa-users fa-3x text-info"></i>',
            redirectURL: '#' // Será implementado posteriormente
        }
    };

    let selectedProfile = null;

    // Adiciona ouvintes de evento para os cards de perfil
    profileCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove a classe selecionada de todos os cards
            profileCards.forEach(c => c.classList.remove('selected'));
            
            // Adiciona a classe selecionada ao card clicado
            card.classList.add('selected');
            
            // Armazena o perfil selecionado
            selectedProfile = card.dataset.profile;
            
            // Atualiza o título, subtítulo e ícone de acordo com o perfil selecionado
            const profile = profileData[selectedProfile];
            if (profileTitle) profileTitle.textContent = profile.title;
            if (profileSubtitle) profileSubtitle.textContent = profile.subtitle;
            if (profileIconDisplay) profileIconDisplay.innerHTML = profile.icon;
            
            // Aguarda um momento para aplicar a animação e depois muda para a etapa de login
            setTimeout(() => {
                if (profileStep) profileStep.classList.remove('active');
                if (loginStep) loginStep.classList.add('active');
            }, 300);
        });
    });

    // Botão para voltar à seleção de perfil
    if (backButton && loginForm) {
        backButton.addEventListener('click', () => {
            loginStep.classList.remove('active');
            profileStep.classList.add('active');
            loginForm.reset();
        });
    }

    // Alternância de visibilidade da senha
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function() {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Alterna o ícone do botão
            const icon = togglePasswordBtn.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-eye');
                icon.classList.toggle('fa-eye-slash');
            }
        });
    }

    // Submissão do formulário
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username')?.value || '';
            const password = document.getElementById('password')?.value || '';
            
            // Mostra um indicador de carregamento
            const submitButton = this.querySelector('button[type="submit"]');
            if (!submitButton) return;
            
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Entrando...';
            submitButton.disabled = true;

            if (selectedProfile === 'escola') {
                // Para o perfil escola, aceita qualquer credencial (comportamento anterior)
                setTimeout(() => {
                    // Armazena nas credenciais locais que é um administrador
                    sessionStorage.setItem('userProfile', 'admin');
                    
                    // Redireciona para o dashboard administrativo
                    window.location.href = profileData[selectedProfile].redirectURL;
                }, 1000);
            } else if (selectedProfile === 'professor') {
                // Para o perfil professor, chamar a API para verificar credenciais
                const loginData = {
                    email_professor: username,
                    senha_professor: password
                };
                
                // Usar o novo endpoint de login de professor
                fetch(CONFIG.getApiUrl('/professores/login'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(loginData)
                })
                .then(response => {
                    if (!response.ok) {
                        if (response.status === 401) {
                            throw new Error('Credenciais inválidas');
                        } else {
                            throw new Error('Erro ao autenticar: ' + response.status);
                        }
                    }
                    return response.json();
                })
                .then(professor => {
                    console.log('Professor autenticado:', professor);
                    
                    // Armazenar dados do professor na sessão
                    sessionStorage.setItem('userProfile', 'professor');
                    sessionStorage.setItem('professorId', professor.id_professor);
                    sessionStorage.setItem('professorNome', professor.nome_professor);
                    sessionStorage.setItem('professorEmail', professor.email_professor);
                    
                    // Salvar também as disciplinas do professor (já vêm no objeto retornado pela API)
                    sessionStorage.setItem('professorDisciplinas', JSON.stringify(professor.disciplinas || []));
                    
                    // Redirecionar para o dashboard do professor
                    window.location.href = profileData[selectedProfile].redirectURL;
                })
                .catch(error => {
                    console.error('Erro ao autenticar:', error);
                    if (error.message === 'Credenciais inválidas') {
                        alert('Email ou senha inválidos. Por favor, tente novamente.');
                    } else {
                        alert('Erro ao conectar com o servidor. Por favor, tente novamente mais tarde.');
                    }
                    submitButton.innerHTML = originalText;
                    submitButton.disabled = false;
                });
            } else if (selectedProfile === 'pai') {
                // Para o perfil pai/responsável (a ser implementado futuramente)
                setTimeout(() => {
                    alert('O acesso para pais/responsáveis ainda não está disponível.');
                    submitButton.innerHTML = originalText;
                    submitButton.disabled = false;
                }, 1000);
            } else {
                alert('Por favor, selecione um perfil de acesso.');
                submitButton.innerHTML = originalText;
                submitButton.disabled = false;
            }
        });
    }

    // Adiciona efeito de hover nos cards de perfil
    profileCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (this && this.style) {
                this.style.transform = 'translateY(-5px)';
                this.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            if (this && this.style) {
                if (!this.classList.contains('selected')) {
                    this.style.transform = 'translateY(0)';
                    this.style.boxShadow = 'none';
                }
            }
        });
    });
}); 