// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDf_AyxRX9d2JuVHvk3kScSb7bH8v5Bh-k",
  authDomain: "action-max.firebaseapp.com",
  projectId: "action-max",
  storageBucket: "action-max.appspot.com",
  messagingSenderId: "183609340889",
  appId: "1:183609340889:web:f32fc8e32d95461a1f5fc8"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURAÇÕES E ESTADO GLOBAL ---
    const apiKey = ''; // Chave da API removida
    const imageBaseUrl = 'https://image.tmdb.org/t/p/original';
    const imagePosterBaseUrl = 'https://image.tmdb.org/t/p/w500';
    const placeholderVideoUrl = 'https://vods1.watchingvs.com/m/A%20Viagem%20de%20Chihiro_2003_tt0245429.mp4';
    
    const avatars = [
        'https://pbs.twimg.com/media/FMs8_KeWYAAtoS3.jpg', 'https://i.pinimg.com/736x/8a/a0/26/8aa026b285c59cd9a3a783b8c363952a.jpg',
        'https://i.pinimg.com/736x/cb/c8/99/cbc8992c6b3e6480b06a5b6515b2e650.jpg', 'https://i.pinimg.com/736x/d8/d5/9a/d8d59a85d301c383f2a87a2d398c8c22.jpg',
        'https://i.pinimg.com/736x/f9/47/9d/f9479d6f359054cb1137021575f85b88.jpg', 'https://i.pinimg.com/736x/bd/2c/31/bd2c31e6e580a149a42a0b8a1c6a66b7.jpg',
        'https://i.pinimg.com/736x/01/b8/96/01b89668f44053f3c306b9eb9a68a55c.jpg', 'https://i.pinimg.com/736x/cc/d7/0f/ccd70f6120245a468e83344625b038c3.jpg'
    ];
    
    // --- ESTADO DA APLICAÇÃO (AGORA CENTRALIZADO) ---
    let APP_STATE = {};
    let currentProfileId = null;
    
    // Variáveis de estado do perfil ativo
    let myList = [];
    let skipTime = 10;
    let playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    let username = 'Usuário';
    let profilePic = 'https://i.pravatar.cc/120';
    let likedComments = {};
    let ratings = {};
    let comments = {};

    const defaultSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

    let isPlayerActive = false;
    let controlsTimeout;
    let currentSeriesData = null;
    let currentEpisodeInfo = {};
    const loadedGrids = new Set();
    let isManagingProfiles = false;
    let editingProfile = null;
    
    // --- SELETORES DE ELEMENTOS DOM ---
    const loadingScreen = document.getElementById('loading-screen');
    const authScreen = document.getElementById('auth-screen');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupBtn = document.getElementById('show-signup-btn');
    const showLoginBtn = document.getElementById('show-login-btn');
    const logoutBtn = document.getElementById('logout-btn');

    const screens = document.querySelectorAll('.screen-content');
    const mainHeader = document.getElementById('main-header');
    const mobileFooter = document.querySelector('footer');
    const notificationsOverlay = document.getElementById('notifications-overlay');
    const notificationsPanel = document.getElementById('notifications-panel');
    const screenContainer = document.getElementById('screen-container');
    
    const playerModal = document.getElementById('video-player-modal');
    const videoPlayerContainer = document.getElementById('video-player-container');
    const video = document.getElementById('main-video');
    const youtubePlayer = document.getElementById('youtube-player');
    const playerControls = document.getElementById('video-player-controls');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const rewindBtn = document.getElementById('rewind-btn');
    const fastForwardBtn = document.getElementById('fast-forward-btn');
    const prevEpisodeBtn = document.getElementById('prev-episode-btn');
    const nextEpisodeBtn = document.getElementById('next-episode-btn');
    const volumeBtn = document.getElementById('volume-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const timeline = document.getElementById('video-player-timeline');
    const currentTimeDisplay = document.getElementById('current-time-display');
    const durationDisplay = document.getElementById('duration-display');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const playerTitle = document.getElementById('player-title');
    const unavailableMessage = document.getElementById('video-unavailable-message');
    const speedBtn = document.getElementById('speed-btn');
    const speedOptions = document.getElementById('speed-options');
    const closePlayerBtn = document.getElementById('close-player-btn');
    
    const skipTimeModalOverlay = document.getElementById('skip-time-modal-overlay');
    const skipTimeModal = document.getElementById('skip-time-modal');
    const speedModalOverlay = document.getElementById('speed-modal-overlay');
    const speedModal = document.getElementById('speed-modal');
    const seasonModalOverlay = document.getElementById('season-modal-overlay');
    const seasonModal = document.getElementById('season-modal');
    const seasonListContainer = document.getElementById('season-list-container');
    const toast = document.getElementById('toast-notification');

    const profileSelectionScreen = document.getElementById('profile-selection-screen');
    const profilesGrid = document.getElementById('profiles-grid');
    const manageProfilesBtn = document.getElementById('manage-profiles-btn');

    const profileModalOverlay = document.getElementById('profile-modal-overlay');
    const profileModal = document.getElementById('profile-modal');
    const profileModalTitle = document.getElementById('profile-modal-title');
    const profileModalAvatar = document.getElementById('profile-modal-avatar');
    const profileModalName = document.getElementById('profile-modal-name');
    const profileModalAvatarGrid = document.getElementById('profile-modal-avatar-grid');
    const saveProfileBtn = document.getElementById('save-profile-btn');
    const cancelProfileBtn = document.getElementById('cancel-profile-btn');
    const deleteProfileBtn = document.getElementById('delete-profile-btn');


    // --- GERENCIAMENTO DE ESTADO E DADOS (localStorage) ---
    const createDefaultProfileData = () => ({
        myList: [],
        skipTime: 10,
        playbackSpeeds: [...defaultSpeeds],
        ratings: {},
        comments: {},
        likedComments: {}
    });

    const loadState = () => {
        const data = localStorage.getItem('actionMaxData');
        APP_STATE = data ? JSON.parse(data) : { profiles: [], profileData: {} };
    };

    const saveState = () => {
        localStorage.setItem('actionMaxData', JSON.stringify(APP_STATE));
    };
    
    const loadProfileData = (profileId) => {
        currentProfileId = profileId;
        const profile = APP_STATE.profiles.find(p => p.id === profileId);
        const data = APP_STATE.profileData[profileId] || createDefaultProfileData();
        
        username = profile.name;
        profilePic = profile.avatar;
        myList = data.myList || [];
        skipTime = data.skipTime || 10;
        playbackSpeeds = data.playbackSpeeds || [...defaultSpeeds];
        ratings = data.ratings || {};
        comments = data.comments || {};
        likedComments = data.likedComments || {};
    };
    
    const saveDataForCurrentProfile = () => {
        if (!currentProfileId) return;
        APP_STATE.profileData[currentProfileId] = {
            myList, skipTime, playbackSpeeds, ratings, comments, likedComments
        };
        saveState();
    };

    // --- FUNÇÕES UTILITÁRIAS ---
    
    const showToast = (message) => {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    async function fetchTMDB(endpoint) { 
        if (!apiKey) {
            console.warn("Chave da API do TMDB não configurada.");
            return null;
        }
        try {
            const url = `https://api.themoviedb.org/3/${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${apiKey}&language=pt-BR&append_to_response=release_dates,content_ratings,credits,videos,external_ids`;
            const response = await fetch(url);
            if (!response.ok) { 
                console.error("Erro na API TMDB:", response.status); 
                showToast("Erro ao carregar dados. Tente novamente.");
                return null; 
            }
            return await response.json();
        } catch (error) { 
            console.error("Falha ao buscar dados do TMDB:", error); 
            showToast("Erro de conexão. Verifique sua internet.");
            return null; 
        }
    }
    
    const formatTime = (timeInSeconds) => {
        if (isNaN(timeInSeconds) || timeInSeconds < 0) return '00:00';
        const hours = Math.floor(timeInSeconds / 3600);
        const minutes = Math.floor((timeInSeconds % 3600) / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        const paddedMinutes = String(minutes).padStart(2, '0');
        const paddedSeconds = String(seconds).padStart(2, '0');
        return hours > 0 ? `${hours}:${paddedMinutes}:${paddedSeconds}` : `${paddedMinutes}:${paddedSeconds}`;
    };

    // --- LÓGICA DE PERFIS ---

    const renderProfileSelectionScreen = () => {
        profilesGrid.innerHTML = '';
        profilesGrid.classList.toggle('managing', isManagingProfiles);
    
        APP_STATE.profiles.forEach(profile => {
            const profileEl = document.createElement('div');
            profileEl.className = 'profile-card flex flex-col items-center gap-2 w-24 md:w-36';
            profileEl.dataset.profileId = profile.id;
            profileEl.innerHTML = `
                <div class="relative">
                    <img src="${profile.avatar}" alt="${profile.name}" class="profile-avatar w-24 h-24 md:w-36 md:h-36 rounded-md object-cover outline outline-0 outline-transparent">
                    <div class="edit-icon hidden absolute inset-0 bg-black/50 items-center justify-center pointer-events-none">
                        <i data-lucide="pencil" class="w-8 h-8 text-white"></i>
                    </div>
                </div>
                <span class="text-gray-400 group-hover:text-white transition-colors">${profile.name}</span>
            `;
            profilesGrid.appendChild(profileEl);
        });

        if (APP_STATE.profiles.length < 4 && !isManagingProfiles) {
            const addProfileEl = document.createElement('div');
            addProfileEl.className = 'profile-card add-profile flex flex-col items-center gap-2 w-24 md:w-36';
            addProfileEl.innerHTML = `
                <div class="w-24 h-24 md:w-36 md:h-36 rounded-md flex items-center justify-center bg-gray-800 hover:bg-gray-700 transition-colors">
                    <i data-lucide="plus-circle" class="w-12 h-12 text-gray-500"></i>
                </div>
                <span class="text-gray-400">Adicionar Perfil</span>
            `;
            profilesGrid.appendChild(addProfileEl);
        }
        manageProfilesBtn.textContent = isManagingProfiles ? 'Concluído' : 'Gerenciar Perfis';
        lucide.createIcons();
        profileSelectionScreen.classList.remove('hidden');
        profileSelectionScreen.classList.add('flex');
    };

    const selectProfile = (profileId) => {
        loadProfileData(profileId);
        profileSelectionScreen.classList.remove('flex');
        profileSelectionScreen.classList.add('hidden');
        mainHeader.classList.remove('hidden');
        mobileFooter.classList.remove('hidden');
        startApp();
    };

    const openProfileModal = (profileToEdit = null) => {
        editingProfile = profileToEdit;
        profileModalTitle.textContent = profileToEdit ? 'Editar Perfil' : 'Criar Perfil';
        profileModalName.value = profileToEdit ? profileToEdit.name : '';
        const currentAvatar = profileToEdit ? profileToEdit.avatar : avatars[0];
        profileModalAvatar.src = currentAvatar;
        
        profileModalAvatarGrid.innerHTML = avatars.map(url => `
            <img src="${url}" class="avatar-option w-full aspect-square object-cover rounded-md cursor-pointer ${url === currentAvatar ? 'selected' : ''}" data-avatar="${url}">
        `).join('');

        deleteProfileBtn.classList.toggle('hidden', !profileToEdit);
        
        profileModalOverlay.classList.remove('hidden');
        setTimeout(() => {
            profileModalOverlay.classList.remove('opacity-0');
            profileModal.classList.remove('opacity-0', 'scale-95');
        }, 10);
    };
    
    const closeProfileModal = () => {
        profileModalOverlay.classList.add('opacity-0');
        profileModal.classList.add('opacity-0', 'scale-95');
        setTimeout(() => profileModalOverlay.classList.add('hidden'), 300);
        editingProfile = null;
    };
    
    const saveProfile = () => {
        const name = profileModalName.value.trim();
        const avatar = document.querySelector('.avatar-option.selected').dataset.avatar;
        if (!name) {
            showToast("Por favor, insira um nome para o perfil.");
            return;
        }

        if (editingProfile) { // Editando
            const profileIndex = APP_STATE.profiles.findIndex(p => p.id === editingProfile.id);
            APP_STATE.profiles[profileIndex] = { ...editingProfile, name, avatar };
        } else { // Criando
            const newProfile = {
                id: Date.now(),
                name,
                avatar
            };
            APP_STATE.profiles.push(newProfile);
            APP_STATE.profileData[newProfile.id] = createDefaultProfileData();
        }
        saveState();
        renderProfileSelectionScreen();
        closeProfileModal();
    };

    const deleteProfile = () => {
        if (!editingProfile) return;
        // Não permitir excluir o último perfil
        if (APP_STATE.profiles.length <= 1) {
            showToast("Não é possível excluir o único perfil existente.");
            return;
        }
        APP_STATE.profiles = APP_STATE.profiles.filter(p => p.id !== editingProfile.id);
        delete APP_STATE.profileData[editingProfile.id];
        saveState();
        renderProfileSelectionScreen();
        closeProfileModal();
    };

    // --- LÓGICA DE NAVEGAÇÃO E EXIBIÇÃO DE TELAS ---

    const showScreen = (targetId, fromHistory = false) => {
         const isDetailsScreen = targetId.startsWith('details');
           mainHeader.classList.toggle('hidden', isDetailsScreen);
           if (mobileFooter) mobileFooter.classList.toggle('hidden', isDetailsScreen);

           screens.forEach(screen => screen.classList.add('hidden'));
           
           let targetScreenId = targetId;
           if (isDetailsScreen) {
               targetScreenId = 'details-screen';
           } else if (targetId.startsWith('genre-results')) {
             targetScreenId = 'genre-results-screen';
           }

           const targetScreen = document.getElementById(targetScreenId);
           
           if (targetScreen) {
               targetScreen.classList.remove('hidden');
               window.scrollTo(0, 0);
               if (!fromHistory && !isPlayerActive) { 
                   const newUrl = `#${targetId}`;
                   const state = { screen: targetId };
                   history.pushState(state, '', newUrl); 
               }
           }
           updateActiveNav(targetScreenId);

           if (!loadedGrids.has(targetId)) {
               // Conteúdo removido - não popula mais os grids automaticamente
               if (targetId === 'edit-profile-screen') renderEditProfileScreen();
               if(targetId !== 'home-screen' && !targetId.startsWith('details')) loadedGrids.add(targetId);
           } else if (targetId === 'my-list-screen') {
               populateMyListPage();
           } else if (targetId === 'edit-profile-screen') {
               renderEditProfileScreen();
           }
    };
    
    const updateActiveNav = (targetId) => {
        let cleanTargetId = targetId.split('/')[0];
        if (targetId === 'genre-results-screen') {
            cleanTargetId = 'genres-screen';
        }
        document.querySelectorAll('header nav .nav-link, #profile-screen .profile-link, #account-settings-screen a, #edit-profile-screen button[data-target]').forEach(nav => {
            const isActive = nav.dataset.target === cleanTargetId;
            nav.classList.toggle('active-nav-link', isActive);
            if (nav.classList.contains('nav-link')) {
                nav.classList.toggle('text-white', isActive);
                nav.classList.toggle('text-gray-400', !isActive);
            }
        });
        document.querySelectorAll('.nav-link-mobile').forEach(nav => {
            const isActive = nav.dataset.target === cleanTargetId;
            nav.classList.toggle('active-nav-link', isActive);
            nav.classList.toggle('text-gray-400', !isActive);
        });
    };
    
    // --- LÓGICA DE CONTEÚDO (CAROUSELS, GRIDS, DETALHES) ---
    
    const renderPoster = (item) => { 
        const posterPath = item.poster_path ? `${imagePosterBaseUrl}${item.poster_path}` : 'https://placehold.co/300x450/334155/ffffff?text=Sem+Imagem';
        const title = item.title || item.name;
        const type = item.media_type || (item.title ? 'movie' : 'tv');
        return `<div class="relative flex-shrink-0 w-40 overflow-hidden md:w-48 content-poster" data-id="${item.id}" data-type="${type}"><img src="${posterPath}" class="object-cover w-full h-auto rounded-md" loading="lazy" alt="${title}"></div>`;
    };

    const renderGridPoster = (item) => {
         const posterPath = item.poster_path ? `${imagePosterBaseUrl}${item.poster_path}` : 'https://placehold.co/300x450/334155/ffffff?text=Sem+Imagem';
        const title = item.title || item.name;
        const type = item.media_type || (item.title ? 'movie' : 'tv');
        return `<div class="w-full overflow-hidden content-poster" data-id="${item.id}" data-type="${type}"><img src="${posterPath}" class="object-cover w-full h-auto rounded-md" loading="lazy" alt="${title}"></div>`;
    };

    const createCarousel = async (containerSelector, title, endpoint) => {
        // Função desativada para não carregar conteúdo
    };

    const populateHomePage = async () => {
         const heroSection = document.getElementById('hero-section');
         heroSection.style.backgroundImage = `url('https://placehold.co/1920x1080/000000/ffffff?text=ActionMax')`;
         heroSection.innerHTML = `
             <div class="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
             <div class="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent"></div>
             <div class="relative z-10 w-full p-6 text-center md:px-12 md:text-left space-y-4 mb-32 md:mb-12">
                 <h2 class="text-4xl font-black uppercase md:text-6xl max-w-3xl mx-auto md:mx-0">Bem-vindo ao ActionMax</h2>
                 <p class="max-w-xl text-sm text-gray-200 line-clamp-3 mx-auto md:mx-0">Sua plataforma de streaming.</p>
             </div>`;
        const homeContainer = document.getElementById('home-carousels');
        homeContainer.innerHTML = ''; // Limpa os carrosséis
        lucide.createIcons();
    };

    const populateGrid = async (gridId, endpoint, itemType) => {
        const grid = document.getElementById(gridId);
        if (!grid) return;
        grid.innerHTML = `<p class="text-gray-400 col-span-full text-center">Nenhum conteúdo para exibir.</p>`;
    };

    const getCertification = async (id, type) => {
       return ''; // Retorna string vazia pois não busca mais dados
    };
    
    const renderDetails = async (contentId, type) => {
        showScreen(`details/${type}/${contentId}`);
        const detailsContentContainer = document.getElementById('details-content-container');
        const bgGradient = document.getElementById('details-bg-gradient');
        bgGradient.style.backgroundImage = 'none';
        detailsContentContainer.innerHTML = `
            <button id="details-back-btn" class="absolute top-6 left-6 z-20 p-2 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors">
                <i data-lucide="arrow-left" class="w-6 h-6"></i>
            </button>
            <p class="text-xl text-center pt-48">Conteúdo indisponível.</p>`;
        lucide.createIcons();
    };

    const populateGenresPage = async () => {
        const grid = document.getElementById('genres-grid');
        if (!grid) return;
        grid.innerHTML = `<p class="text-gray-400 col-span-full text-center">Gêneros indisponíveis no momento.</p>`;
    };

    const renderGenreResults = async (genreId, genreName) => {
        showScreen('genre-results-screen', true);
        history.pushState({ screen: `genres/${genreId}/${genreName}` }, '', `#genres/${genreId}/${encodeURIComponent(genreName)}`);
        document.getElementById('genre-results-title').textContent = genreName;
        const grid = document.getElementById('genre-results-grid');
        grid.innerHTML = `<p class="text-gray-400 col-span-full text-center">Nenhum conteúdo para este gênero.</p>`;
    };

    // --- LÓGICA DE SÉRIES (TEMPORADAS E EPISÓDIOS) ---
    
    const renderSeasons = async (seriesData) => {
        // Função desativada
    };
    
    const renderEpisodes = async (seriesId, seasonNumber) => {
         // Função desativada
    };

    // --- LÓGICA DO PLAYER DE VÍDEO ---

    const openPlayer = ({ src = null, title = '', type = 'video', isSeries = false, episodeInfo = {} }) => {
        playerTitle.textContent = title;
        currentEpisodeInfo = isSeries ? episodeInfo : {};

        prevEpisodeBtn.classList.toggle('hidden', !isSeries);
        nextEpisodeBtn.classList.toggle('hidden', !isSeries);
        updateEpisodeNavButtons();

        unavailableMessage.style.display = 'none';
        video.classList.add('hidden');
        youtubePlayer.classList.add('hidden');
        
        if (type === 'youtube') {
            youtubePlayer.src = `https://www.youtube.com/embed/${src}?autoplay=1&modestbranding=1&rel=0`;
            youtubePlayer.classList.remove('hidden');
            playerControls.classList.add('hidden'); // Oculta controles para trailers
        } else if (src) {
            video.src = src;
            video.classList.remove('hidden');
            playerControls.classList.remove('hidden'); // Mostra controles para filmes/séries
        } else {
            video.removeAttribute('src');
            video.load();
            unavailableMessage.style.display = 'flex';
        }
        
        playerModal.classList.add('active');
        isPlayerActive = true;
        history.pushState({ playerOpen: true }, '');

        if (type !== 'youtube') showPlayerControls();

        if(window.innerWidth < 768) {
            try {
                playerModal.requestFullscreen();
                screen.orientation.lock('landscape');
            } catch(e) {
                console.warn("Bloqueio de orientação ou tela cheia falhou:", e);
            }
        }
    };

    const closePlayerUI = () => {
        if (!isPlayerActive) return;

        video.pause();
        video.removeAttribute('src');
        video.load();
        youtubePlayer.src = ''; // CORREÇÃO: Maneira mais confiável de parar/limpar o iframe
        playerControls.classList.remove('hidden'); // Garante que os controles voltem ao normal

        playerModal.classList.remove('active');
        isPlayerActive = false;
        clearTimeout(controlsTimeout);

        try {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
            if (screen.orientation && screen.orientation.unlock) {
                screen.orientation.unlock();
            }
        } catch (e) {
             console.warn("Falha ao sair da tela cheia ou desbloquear orientação:", e);
        }
    };
    
    const showPlayerControls = () => {
        clearTimeout(controlsTimeout);
        videoPlayerContainer.classList.add('user-active');
        if (!video.paused) {
            controlsTimeout = setTimeout(() => {
                videoPlayerContainer.classList.remove('user-active');
            }, 3000);
        }
    };
    
    const updateEpisodeNavButtons = () => {
         if (!currentSeriesData || !currentEpisodeInfo.seasonNumber) {
             prevEpisodeBtn.disabled = true;
             nextEpisodeBtn.disabled = true;
             return;
        }
        
        const season = currentSeriesData.seasons.find(s => s.season_number == currentEpisodeInfo.seasonNumber);
        if (!season) return;
        
        prevEpisodeBtn.disabled = currentEpisodeInfo.episodeNumber <= 1;
        nextEpisodeBtn.disabled = currentEpisodeInfo.episodeNumber >= season.episode_count;
        
        prevEpisodeBtn.classList.toggle('opacity-50', prevEpisodeBtn.disabled);
        nextEpisodeBtn.classList.toggle('opacity-50', nextEpisodeBtn.disabled);
    };
    
    const navigateEpisode = async (direction) => {
        // Função desativada, pois depende dos dados do TMDB
    };

    // --- LÓGICA DE INTERAÇÃO (LISTA, AVALIAÇÃO, COMENTÁRIOS, MODAIS) ---
    
    const isInMyList = (id, type) => myList.some(item => item.id == id && item.type == type);
    const toggleMyList = (id, type, buttonElement) => {
        if (isInMyList(id, type)) { 
            myList = myList.filter(item => !(item.id == id && item.type == type)); 
            showToast("Removido da sua lista.");
        } else { 
            myList.push({ id, type }); 
            showToast("Adicionado à sua lista.");
        }
        saveDataForCurrentProfile();
        updateMyListButton(buttonElement, id, type);
    };
    const updateMyListButton = (button, id, type) => {
        const inList = isInMyList(id, type);
        button.title = inList ? "Remover da Minha Lista" : "Adicionar à Minha Lista";
        button.innerHTML = `<i data-lucide="${inList ? 'check' : 'plus'}" class="w-5 h-5"></i>`;
        lucide.createIcons();
    };
    const populateMyListPage = async () => {
         const grid = document.getElementById('my-list-grid');
        if (!grid) return;
        if (myList.length === 0) { grid.innerHTML = `<p class="text-gray-400 col-span-full text-center">Sua lista está vazia.</p>`; return; }
        grid.innerHTML = `<p class="text-gray-400 col-span-full text-center">Não foi possível carregar o conteúdo da lista.</p>`;
    };
    
    const getRatingKey = (contentId, type) => `${contentId}_${type}`;
    const getMyRating = (contentId, type) => ratings[getRatingKey(contentId, type)] || 0;
    const saveRating = (contentId, type, rating) => {
        ratings[getRatingKey(contentId, type)] = rating;
        saveDataForCurrentProfile();
    };
    const updateRatingSection = (contentId, type) => {
        const container = document.getElementById('rating-section');
        if (!container) return;
        
        const myRating = getMyRating(contentId, type);
        const average = myRating > 0 ? myRating.toFixed(1) : 'N/A';
        const voteCount = myRating > 0 ? 1 : 0;

        let starsHTML = '';
        for (let i = 1; i <= 5; i++) { starsHTML += `<i data-lucide="star" class="w-8 h-8 ${i <= myRating ? 'filled' : ''}" data-value="${i}"></i>`; }
        container.innerHTML = `<h3 class="font-semibold mb-2">Sua Avaliação</h3><div class="star-rating interactive flex items-center justify-center md:justify-start space-x-1">${starsHTML}</div><div class="text-sm text-muted mt-2">Avaliação Média: <span class="font-bold text-color">${average}</span> (${voteCount} votos)</div>`;
        lucide.createIcons();
    };

    const getCommentsKey = (contentId, type) => `${contentId}_${type}`;
    const getComments = (contentId, type) => comments[getCommentsKey(contentId, type)] || [];
    const saveComments = (contentId, type, newComments) => {
        comments[getCommentsKey(contentId, type)] = newComments;
        saveDataForCurrentProfile();
    }
    const renderComments = (contentId, type) => {
        const container = document.getElementById('comments-section');
        if (!container) return;
        const currentComments = getComments(contentId, type);
        
        const createCommentHTML = (comment, isReply = false) => {
            const likedByMe = likedComments[comment.id];
            return `
            <div class="py-2 ${isReply ? 'ml-8' : ''}">
                <div class="flex items-start space-x-3">
                    <img src="${comment.user === username ? profilePic : comment.avatar}" class="w-10 h-10 rounded-full object-cover"/>
                    <div class="flex-1">
                        <div class="surface p-4 rounded-lg rounded-tl-none">
                            <div class="flex items-center justify-between mb-1">
                                <span class="font-bold">${comment.user}</span>
                                <span class="text-xs text-muted">${comment.date}</span>
                            </div>
                            <p class="text-muted text-sm">${comment.text}</p>
                        </div>
                        <div class="flex items-center space-x-4 text-xs text-muted px-2 pt-1">
                            <button class="like-btn font-semibold flex items-center gap-1.5 transition-colors hover:text-purple-400 ${likedByMe ? 'text-purple-400' : ''}" data-comment-id="${comment.id}">
                                <i data-lucide="heart" class="w-4 h-4 pointer-events-none ${likedByMe ? 'fill-current' : ''}"></i>
                                <span>${comment.likes}</span>
                            </button>
                            ${!isReply ? `<button class="reply-btn font-semibold hover:text-purple-400" data-comment-id="${comment.id}">Responder</button>` : ''}
                            ${comment.user === username ? `<button class="delete-btn font-semibold hover:text-red-500" data-comment-id="${comment.id}">Excluir</button>` : ''}
                        </div>
                        <div class="replies-container pt-2 space-y-2">${(comment.replies || []).map(reply => createCommentHTML(reply, true)).join('')}</div>
                        <div class="reply-form-container hidden pt-2"></div>
                    </div>
                </div>
            </div>`;
        };

        container.innerHTML = `
            <h3 class="font-semibold mb-4 text-xl">Comentários</h3>
            <div class="flex items-center gap-2 mb-6"><input type="text" id="comment-input" placeholder="Adicione um comentário..." class="w-full p-3 text-color placeholder-text-muted bg-gray-800 border-2 border-transparent rounded-full focus:outline-none focus:border-purple-500"><button id="submit-comment-btn" class="bg-purple-600 hover:bg-purple-700 p-3 rounded-full"><i data-lucide="send" class="w-5 h-5"></i></button></div>
            <div class="space-y-4 max-h-[50vh] overflow-y-auto scrollbar-hide">${currentComments.map(c => createCommentHTML(c, false)).join('') || '<p class="text-muted">Seja o primeiro a comentar!</p>'}</div>`;
        lucide.createIcons();
    };

    const openSeasonsModal = (seriesData) => {
        seasonListContainer.innerHTML = '<p class="text-muted text-center col-span-full">Indisponível.</p>';
        seasonModalOverlay.classList.remove('hidden');
        setTimeout(() => {
            seasonModalOverlay.classList.remove('opacity-0');
            seasonModal.classList.remove('opacity-0', 'scale-95');
        }, 10);
    };

    const closeSeasonsModal = () => {
        seasonModalOverlay.classList.add('opacity-0');
        seasonModal.classList.add('opacity-0', 'scale-95');
        setTimeout(() => seasonModalOverlay.classList.add('hidden'), 300);
    };
    
    const updateProfileInfo = () => {
        if (!currentProfileId) return;
        document.getElementById('profile-icon').src = profilePic;
        document.getElementById('profile-screen-pic').src = profilePic;
        document.getElementById('profile-screen-name').textContent = username;
    }

    const renderEditProfileScreen = () => {
        const usernameInput = document.getElementById('username-input');
        const avatarGrid = document.getElementById('avatar-grid');
        
        usernameInput.value = username;
        
        avatarGrid.innerHTML = avatars.map(avatarUrl => `
            <img src="${avatarUrl}" class="avatar-option w-full aspect-square object-cover rounded-full cursor-pointer ${profilePic === avatarUrl ? 'selected' : ''}" data-avatar="${avatarUrl}">
        `).join('');
    };


    // --- INICIALIZAÇÃO E EVENT LISTENERS GERAIS ---
    
    const handleInitialLoad = (hash) => {
        // Simplificado para não depender de IDs de conteúdo
        const screenId = document.getElementById(hash) ? hash : 'home-screen';
        showScreen(screenId, true);
        if (screenId === 'home-screen') {
            populateHomePage();
        }
    };

    const startApp = () => {
        updateProfileInfo();
        populateSpeedOptions();
        updateSkipTimeButtons();
        const initialHash = location.hash.substring(1);
        handleInitialLoad(initialHash || 'home-screen');
        lucide.createIcons();
    };

    const initializeApp = () => {
        loadState();
        if (APP_STATE.profiles.length === 0) {
            openProfileModal();
        } else {
            renderProfileSelectionScreen();
        }
    };
    // --- AUTHENTICATION FLOW ---
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 500); // Wait for fade out animation
    }, 3000);

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, hide auth screen and start the app
            authScreen.classList.add('hidden');
            initializeApp();
        } else {
            // User is signed out, show auth screen after loading
            setTimeout(() => { // Ensure this runs after loading screen fade
                authScreen.classList.remove('hidden');
                authScreen.classList.add('flex');
            }, 3500); 
        }
    });

    showSignupBtn.addEventListener('click', () => {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    });

    showLoginBtn.addEventListener('click', () => {
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });

    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        if (password !== confirmPassword) {
            showToast('As senhas não coincidem.');
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                showToast('Conta criada com sucesso!');
                // onAuthStateChanged will handle the rest
            })
            .catch((error) => {
                const errorCode = error.code;
                let message = 'Ocorreu um erro ao cadastrar.';
                if (errorCode === 'auth/weak-password') {
                    message = 'A senha deve ter pelo menos 6 caracteres.';
                } else if (errorCode === 'auth/email-already-in-use') {
                    message = 'Este email já está em uso.';
                } else if (errorCode === 'auth/invalid-email') {
                    message = 'Email inválido.';
                }
                showToast(message);
            });
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // onAuthStateChanged will handle the rest
            })
            .catch((error) => {
                let message = 'Erro ao entrar. Verifique seu email e senha.';
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                     message = 'Email ou senha incorretos.';
                }
                 showToast(message);
            });
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            signOut(auth).then(() => {
                showToast('Você saiu.');
                window.location.hash = '';
                window.location.reload();
            }).catch((error) => {
                showToast('Erro ao sair.');
            });
        });
    }

    // --- EVENT LISTENERS ---

    screenContainer.addEventListener('click', async (event) => {
        const navLink = event.target.closest('[data-target]');
        if (navLink && !navLink.closest('.profile-link')) { event.preventDefault(); showScreen(navLink.dataset.target); }
        
        const profileLink = event.target.closest('.profile-link[data-target]');
        if(profileLink) { event.preventDefault(); showScreen(profileLink.dataset.target); }

        const poster = event.target.closest('.content-poster');
        if (poster) renderDetails(poster.dataset.id, poster.dataset.type);
        
        const backBtn = event.target.closest('#details-back-btn');
        if (backBtn) history.back();
        
        const genreCard = event.target.closest('.genre-card');
        if (genreCard) {
            const { genreId, genreName } = genreCard.dataset;
            renderGenreResults(genreId, genreName);
        }

        const carouselBtn = event.target.closest('.carousel-nav-btn');
        if (carouselBtn) { const carousel = document.getElementById(carouselBtn.dataset.carousel); if(carousel) carousel.scroll({left: carousel.scrollLeft + carousel.offsetWidth * 0.8 * parseInt(carouselBtn.dataset.direction), behavior: 'smooth'}); }
        
        const infoButton = event.target.closest('.info-button');
        if (infoButton) renderDetails(infoButton.dataset.id, infoButton.dataset.type);

        const myListButton = event.target.closest('.my-list-button');
        if (myListButton) toggleMyList(myListButton.dataset.id, myListButton.dataset.type, myListButton);
        
        const readMoreBtn = event.target.closest('#read-more-btn');
        if (readMoreBtn) { const synopsis = document.getElementById('synopsis-text'); synopsis.classList.toggle('line-clamp-3'); readMoreBtn.textContent = synopsis.classList.contains('line-clamp-3') ? 'Ler mais' : 'Ler menos'; }
        
        const viewCastBtn = event.target.closest('#view-cast-btn');
        if(viewCastBtn) { renderCast(viewCastBtn.dataset.id, viewCastBtn.dataset.type); viewCastBtn.style.display = 'none'; }
        const hideCastBtn = event.target.closest('#hide-cast-btn');
        if(hideCastBtn) { document.getElementById('cast-section').classList.add('hidden'); hideCastBtn.remove(); document.getElementById('view-cast-btn').style.display = 'inline'; }
        
        const star = event.target.closest('.star-rating.interactive .lucide-star');
        if (star) { 
            const ratingSection = star.closest('#rating-section');
            const contentId = ratingSection.dataset.id; 
            const type = ratingSection.dataset.type;
            const ratingValue = parseInt(star.dataset.value); 
            saveRating(contentId, type, ratingValue); 
            updateRatingSection(contentId, type); 
        }
        
        const watchButton = event.target.closest('.watch-button');
        if (watchButton) { 
            const { id, title, type } = watchButton.dataset;
            openPlayer({ src: placeholderVideoUrl, title, type: 'video' });
        }

        const watchEpisodeBtn = event.target.closest('.watch-episode-btn');
        if (watchEpisodeBtn) {
            const { seriesId, seasonNumber, episodeNumber, title } = watchEpisodeBtn.dataset;
            openPlayer({
                src: placeholderVideoUrl,
                title: title,
                type: 'video',
                isSeries: true,
                episodeInfo: {
                    seriesId: parseInt(seriesId),
                    seasonNumber: parseInt(seasonNumber),
                    episodeNumber: parseInt(episodeNumber)
                }
            });
        }

        const trailerButton = event.target.closest('.trailer-button');
        if (trailerButton) {
            openPlayer({ src: trailerButton.dataset.trailerKey, title: 'Trailer', type: 'youtube' });
        }

        const downloadButton = event.target.closest('.download-button');
        if (downloadButton) {
            event.preventDefault();
            showToast('Função de download em desenvolvimento.');
        }

        const changeSkipBtn = event.target.closest('#change-skip-time-btn');
        if (changeSkipBtn) openSkipTimeModal();
        
        const manageSpeedBtn = event.target.closest('#manage-speed-btn');
        if(manageSpeedBtn) openSpeedModal();

        // Handlers para a tela de editar perfil
        const saveUsernameBtn = event.target.closest('#save-username-btn');
        if (saveUsernameBtn) {
            const newUsername = document.getElementById('username-input').value.trim();
            if (newUsername) {
                username = newUsername;
                const profileIndex = APP_STATE.profiles.findIndex(p => p.id === currentProfileId);
                APP_STATE.profiles[profileIndex].name = newUsername;
                saveState();
                updateProfileInfo();
                showToast('Nome de usuário atualizado!');
            }
        }

        const avatarImg = event.target.closest('#avatar-grid .avatar-option');
        if (avatarImg) {
            profilePic = avatarImg.dataset.avatar;
            const profileIndex = APP_STATE.profiles.findIndex(p => p.id === currentProfileId);
            APP_STATE.profiles[profileIndex].avatar = profilePic;
            saveState();
            updateProfileInfo();
            
            document.querySelectorAll('#avatar-grid .avatar-option').forEach(el => el.classList.remove('selected'));
            avatarImg.classList.add('selected');
            showToast('Avatar atualizado!');
        }

        const switchProfileBtn = event.target.closest('#switch-profile-btn');
        if(switchProfileBtn) {
            currentProfileId = null;
            mainHeader.classList.add('hidden');
            mobileFooter.classList.add('hidden');
            screens.forEach(screen => screen.classList.add('hidden'));
            history.pushState({ screen: 'home-screen' }, '', '#home-screen');
            renderProfileSelectionScreen();
        }

        // Handlers de Comentários
        const commentsSection = event.target.closest('#comments-section');
        if(!commentsSection) return;

        const contentId = commentsSection.dataset.id;
        const type = commentsSection.dataset.type;
        const commentsKey = getCommentsKey(contentId, type);

        const likeBtn = event.target.closest('.like-btn');
        const replyBtn = event.target.closest('.reply-btn');
        const deleteBtn = event.target.closest('.delete-btn');
        const submitCommentBtn = event.target.closest('#submit-comment-btn');
        const submitReplyBtn = event.target.closest('.submit-reply-btn');
        
        if(likeBtn) {
            const commentId = likeBtn.dataset.commentId;
            const liked = likedComments[commentId];
            likedComments[commentId] = !liked;
            
            let currentComments = getComments(contentId, type);
            const findAndLike = (arr) => {
                for(let c of arr){
                    if(c.id == commentId){ c.likes += liked ? -1 : 1; return true; }
                    if(c.replies && findAndLike(c.replies)) return true;
                }
                return false;
            }
            findAndLike(currentComments);
            saveComments(contentId, type, currentComments);
            saveDataForCurrentProfile();
            renderComments(contentId, type);
        }
        if(replyBtn) {
            const formContainer = replyBtn.closest('div').nextElementSibling.nextElementSibling;
            formContainer.innerHTML = `<div class="flex items-center gap-2"><input type="text" class="reply-input w-full p-2 text-sm text-color placeholder-text-muted bg-gray-800 border-2 border-transparent rounded-full focus:outline-none focus:border-purple-500" placeholder="Escreva uma resposta..."><button class="submit-reply-btn bg-purple-600 hover:bg-purple-700 p-2 rounded-full" data-comment-id="${replyBtn.dataset.commentId}"><i data-lucide="send" class="w-4 h-4"></i></button></div>`;
            formContainer.classList.remove('hidden');
            lucide.createIcons();
        }
         if(submitReplyBtn) {
            const commentId = submitReplyBtn.dataset.commentId;
            const input = submitReplyBtn.previousElementSibling;
            const text = input.value.trim();
            if(!text) return;
            let currentComments = getComments(contentId, type);
            const newReply = { id: Date.now(), user: username, text, date: new Date().toLocaleDateString('pt-BR'), likes: 0, replies: [], avatar: profilePic };
            const findAndReply = (arr) => {
                for(let c of arr){
                    if(c.id == commentId){ if(!c.replies) c.replies = []; c.replies.unshift(newReply); return true; }
                    if(c.replies && findAndReply(c.replies)) return true;
                }
                return false;
            }
            findAndReply(currentComments);
            saveComments(contentId, type, currentComments);
            renderComments(contentId, type);
        }
        if(deleteBtn) {
            const commentId = deleteBtn.dataset.commentId;
            let currentComments = getComments(contentId, type);
            const findAndDelete = (arr) => {
                for(let i = 0; i < arr.length; i++){
                    if(arr[i].id == commentId){ arr.splice(i, 1); return true; }
                    if(arr[i].replies && findAndDelete(arr[i].replies)) return true;
                }
                return false;
            }
            findAndDelete(currentComments);
            saveComments(contentId, type, currentComments);
            renderComments(contentId, type);
        }
        if (submitCommentBtn) { 
            const input = document.getElementById('comment-input'); 
            if(input.value.trim()){ 
                let currentComments = getComments(contentId, type);
                currentComments.unshift({ id: Date.now(), user: username, text: input.value.trim(), date: new Date().toLocaleDateString('pt-BR'), likes: 0, replies: [], avatar: profilePic });
                saveComments(contentId, type, currentComments);
                renderComments(contentId, type);
            }
        }
    });

    mainHeader.addEventListener('click', (e) => {
        const target = e.target.closest('[data-target]');
        if(target) { e.preventDefault(); showScreen(target.dataset.target); }
        if (e.target.closest('#notifications-bell-icon')) { openNotifications(); }
    });
    
    mobileFooter.addEventListener('click', (e) => { 
        const target = e.target.closest('[data-target]'); 
        if (target) { e.preventDefault(); showScreen(target.dataset.target); }
    });
    
    window.addEventListener('popstate', (event) => {
        if (isPlayerActive) {
            closePlayerUI();
        } else if (event.state && event.state.screen) {
            const screen = event.state.screen;
            handleInitialLoad(screen); // Simplificado
        } else {
            const currentHash = location.hash.substring(1);
            handleInitialLoad(currentHash || 'home-screen');
        }
    });

    window.addEventListener('scroll', () => mainHeader.classList.toggle('scrolled', window.scrollY > 50));

    // Player Event Listeners
    closePlayerBtn.addEventListener('click', () => {
        if (history.state && history.state.playerOpen) {
            history.back();
        } else {
            closePlayerUI();
        }
    });
    playPauseBtn.onclick = () => video.paused ? video.play() : video.pause();
    rewindBtn.onclick = () => video.currentTime -= skipTime;
    fastForwardBtn.onclick = () => video.currentTime += skipTime;
    volumeSlider.oninput = (e) => { video.volume = e.target.value; video.muted = e.target.value == 0; };
    volumeBtn.onclick = () => video.muted = !video.muted;
    video.onvolumechange = () => { volumeSlider.value = video.volume; let icon = 'volume-2'; if (video.muted || video.volume === 0) icon = 'volume-x'; else if (video.volume < 0.5) icon = 'volume-1'; volumeBtn.innerHTML = `<i data-lucide="${icon}" class="w-7 h-7"></i>`; lucide.createIcons(); };
    video.onplay = () => { playPauseBtn.innerHTML = '<i data-lucide="pause" class="w-8 h-8"></i>'; lucide.createIcons(); videoPlayerContainer.classList.remove('paused'); showPlayerControls(); };
    video.onpause = () => { playPauseBtn.innerHTML = '<i data-lucide="play" class="w-8 h-8"></i>'; lucide.createIcons(); videoPlayerContainer.classList.add('paused'); clearTimeout(controlsTimeout); videoPlayerContainer.classList.add('user-active'); };
    video.ontimeupdate = () => { if(video.duration) { timeline.value = (video.currentTime / video.duration) * 100; timeline.style.setProperty('--value', `${timeline.value}%`); currentTimeDisplay.textContent = formatTime(video.currentTime); }};
    video.onloadedmetadata = () => { durationDisplay.textContent = formatTime(video.duration); };
    timeline.oninput = (e) => { if(video.duration) { video.currentTime = (e.target.value / 100) * video.duration; }};
    fullscreenBtn.onclick = () => document.fullscreenElement ? document.exitFullscreen() : playerModal.requestFullscreen();
    videoPlayerContainer.addEventListener('mousemove', showPlayerControls);
    videoPlayerContainer.addEventListener('click', showPlayerControls);
    prevEpisodeBtn.addEventListener('click', () => navigateEpisode(-1));
    nextEpisodeBtn.addEventListener('click', () => navigateEpisode(1));
    
    seasonModalOverlay.addEventListener('click', (e) => {
        if (e.target === seasonModalOverlay || e.target.closest('#close-season-modal-btn')) {
            closeSeasonsModal();
        }
        const seasonCard = e.target.closest('.season-card-btn');
        if (seasonCard) {
            const { seriesId, seasonNumber } = seasonCard.dataset;
            document.getElementById('current-season-display').textContent = `Temporada ${seasonNumber}`;
            renderEpisodes(seriesId, seasonNumber);
            closeSeasonsModal();
        }
    });

    // Event Listeners para Perfil
    profileSelectionScreen.addEventListener('click', (e) => {
        const profileCard = e.target.closest('.profile-card');
        if (!profileCard) return;

        if (isManagingProfiles) {
            if (!profileCard.classList.contains('add-profile')) {
                const profileId = parseInt(profileCard.dataset.profileId);
                const profile = APP_STATE.profiles.find(p => p.id === profileId);
                openProfileModal(profile);
            }
        } else {
            if (profileCard.classList.contains('add-profile')) {
                openProfileModal();
            } else {
                const profileId = parseInt(profileCard.dataset.profileId);
                selectProfile(profileId);
            }
        }
    });

    manageProfilesBtn.addEventListener('click', () => {
        isManagingProfiles = !isManagingProfiles;
        renderProfileSelectionScreen();
    });

    profileModalOverlay.addEventListener('click', (e) => {
        if (e.target === profileModalOverlay) closeProfileModal();
    });
    cancelProfileBtn.addEventListener('click', closeProfileModal);
    saveProfileBtn.addEventListener('click', saveProfile);
    deleteProfileBtn.addEventListener('click', deleteProfile);
    profileModalAvatarGrid.addEventListener('click', e => {
        const avatarImg = e.target.closest('.avatar-option');
        if(avatarImg) {
            document.querySelectorAll('#profile-modal-avatar-grid .avatar-option').forEach(el => el.classList.remove('selected'));
            avatarImg.classList.add('selected');
            profileModalAvatar.src = avatarImg.src;
        }
    });

    // --- CÓDIGO RESTANTE (MODAIS, BUSCA, ETC.) ---
    const openNotifications = () => {
         notificationsOverlay.classList.remove('hidden');
         setTimeout(() => { notificationsOverlay.classList.remove('opacity-0'); notificationsPanel.classList.remove('translate-x-full'); }, 10);
    };
    const closeNotifications = () => {
         notificationsOverlay.classList.add('opacity-0');
         notificationsPanel.classList.add('translate-x-full');
         setTimeout(() => notificationsOverlay.classList.add('hidden'), 300);
    };
     document.getElementById('close-notifications-btn').addEventListener('click', closeNotifications);
     notificationsOverlay.addEventListener('click', (e) => { if (e.target === notificationsOverlay) closeNotifications(); });

    const renderCast = async (contentId, type) => {
        const castSection = document.getElementById('cast-section');
        if(!castSection) return;
        castSection.innerHTML = `<h3 class="font-semibold mb-4 text-xl">Elenco Principal</h3><p class="text-muted">Elenco não disponível.</p>`;
        castSection.classList.remove('hidden');
    };
    const updateSkipTimeButtons = () => {
         const rewindDisplay = document.getElementById('rewind-time-display');
         const ffDisplay = document.getElementById('fast-forward-time-display');
         if(rewindDisplay) rewindDisplay.textContent = skipTime;
         if(ffDisplay) ffDisplay.textContent = skipTime;
     }
    const openSkipTimeModal = () => {
        skipTimeModalOverlay.classList.remove('hidden');
        setTimeout(() => {
            skipTimeModalOverlay.classList.remove('opacity-0');
            skipTimeModal.classList.remove('opacity-0', 'scale-95');
        }, 10);
    };
    const closeSkipTimeModal = () => {
         skipTimeModalOverlay.classList.add('opacity-0');
         skipTimeModal.classList.add('opacity-0', 'scale-95');
         setTimeout(() => skipTimeModalOverlay.classList.add('hidden'), 300);
    };
    skipTimeModalOverlay.addEventListener('click', (e) => {
        if(e.target === skipTimeModalOverlay || e.target.closest('#close-skip-modal-btn')) closeSkipTimeModal();
        const skipBtn = e.target.closest('.skip-option-btn');
        if(skipBtn){
            skipTime = parseInt(skipBtn.dataset.skip);
            saveDataForCurrentProfile();
            updateSkipTimeButtons();
            showToast(`Tempo de pulo alterado para ${skipTime}s.`);
            closeSkipTimeModal();
        }
        const saveCustomBtn = e.target.closest('#save-custom-skip-btn');
        if(saveCustomBtn){
            const input = document.getElementById('custom-skip-input');
            const newTime = parseInt(input.value);
            if (!isNaN(newTime) && newTime > 0) { 
                skipTime = newTime;
                saveDataForCurrentProfile();
                updateSkipTimeButtons();
                showToast(`Tempo de pulo alterado para ${skipTime}s.`);
                closeSkipTimeModal();
            } else {
                showToast('Por favor, insira um número válido.');
            }
        }
    });

    const populateSpeedOptions = () => {
        speedOptions.innerHTML = '';
        playbackSpeeds.sort((a,b) => a-b).forEach(speed => {
            const speedBtnElement = document.createElement('button');
            speedBtnElement.className = 'p-2 hover:bg-purple-600 w-full text-center rounded-md';
            speedBtnElement.textContent = `${speed}x`;
            speedBtnElement.dataset.speed = speed;
            speedOptions.appendChild(speedBtnElement);
        });
    };
    const openSpeedModal = () => {
        const renderSpeedList = () => {
            const speedList = document.getElementById('speed-list');
            speedList.innerHTML = '';
            playbackSpeeds.sort((a,b) => a-b).forEach(speed => {
                const isDefault = defaultSpeeds.includes(speed);
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-2 surface-hover rounded';
                item.innerHTML = `<span>${speed}x ${isDefault ? '<span class="text-xs text-muted">(padrão)</span>' : ''}</span>
                                ${!isDefault ? `<button data-speed="${speed}" class="delete-speed-btn text-red-500"><i class="pointer-events-none" data-lucide="trash-2"></i></button>` : ''}`;
                speedList.appendChild(item);
            });
            lucide.createIcons();
        };
        renderSpeedList();
        speedModalOverlay.classList.remove('hidden');
        setTimeout(() => { speedModalOverlay.classList.remove('opacity-0'); speedModal.classList.remove('opacity-0', 'scale-95'); }, 10);
    };
    const closeSpeedModal = () => {
         speedModalOverlay.classList.add('opacity-0');
         speedModal.classList.add('opacity-0', 'scale-95');
         setTimeout(() => speedModalOverlay.classList.add('hidden'), 300);
    };
    speedModalOverlay.addEventListener('click', (e) => {
        if(e.target === speedModalOverlay || e.target.closest('#close-speed-modal-btn')) closeSpeedModal();
        const deleteBtn = e.target.closest('.delete-speed-btn');
        if(deleteBtn){
            playbackSpeeds = playbackSpeeds.filter(s => s != deleteBtn.dataset.speed);
            saveDataForCurrentProfile();
            populateSpeedOptions();
            openSpeedModal();
        }
        const addBtn = e.target.closest('#save-custom-speed-btn');
        if(addBtn){
            const input = document.getElementById('custom-speed-input');
            const newSpeed = parseFloat(input.value);
            if(!isNaN(newSpeed) && newSpeed >= 0.25 && newSpeed <= 4 && !playbackSpeeds.includes(newSpeed)){
                playbackSpeeds.push(newSpeed);
                saveDataForCurrentProfile();
                populateSpeedOptions();
                openSpeedModal();
                input.value = '';
            } else {
                showToast('Valor inválido ou já existente.');
            }
        }
    });
    document.getElementById('search-input').addEventListener('input', async (event) => {
         const resultsGrid = document.getElementById('search-results');
         resultsGrid.innerHTML = `<p class="text-gray-400 col-span-full text-center">A busca está desativada.</p>`;
    });
    
    speedBtn.addEventListener('click', () => speedOptions.classList.toggle('hidden'));
    speedOptions.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if(target && target.dataset.speed){
            const speed = parseFloat(target.dataset.speed);
            video.playbackRate = speed;
            speedBtn.textContent = `${speed}x`;
            speedOptions.classList.add('hidden');
        }
    });
});

