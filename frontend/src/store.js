import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'

import router from './router'

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        session_uuid: null,
        language: 'pl',
        user: null
    },
    mutations: {
        authUser(state, session_uuid) {
            state.session_uuid = session_uuid;
            console.log('al', session_uuid)
        },
        storeUser(state, user) {
            state.user = user;
            console.log('al', user)
        },
        clearAuthData(state) {
            console.log('logout');
            console.log(state.user);
            console.log(state.session_uuid);
            state.session_uuid = null;
        }
    },
    actions: {
        setLogoutTimer({commit}, expirationTime) {
            setTimeout(() => {
                commit('clearAuthData')
            }, expirationTime * 1000)
        },
        signup({commit, dispatch}, data) {
            axios.post('/users', data)
                .then(res => {
                    commit('authUser', {
                        session_uuid: res.data.session_uuid,
                    });
                    const now = new Date()
                    const expirationDate = new Date(now.getTime() + res.data.expiresIn * 1000)
                    localStorage.setItem('session_uuid', res.data.session_uuid)
                    localStorage.setItem('expirationDate', expirationDate)
                    dispatch('storeUser', authData)
                    dispatch('setLogoutTimer', res.data.expiresIn)
                })
                .catch(error => console.log(error))
        },
        login({commit, dispatch}, authData) {
            axios.post('/auth/login', {
                email: authData.email,
                password: authData.password,
            })
                .then(res => {
                    const now = new Date()
                    const expirationDate = new Date(now.getTime() + 10000000 * 1000);
                    localStorage.setItem('session_uuid', res.data.session_uuid);
                    localStorage.setItem('expirationDate', expirationDate);
                    localStorage.setItem('user',  JSON.stringify(res.data));
                    commit('storeUser', res.data);
                    commit('authUser', res.data.session_uuid);
                    dispatch('setLogoutTimer', res.data.expiresIn)
                });
            router.replace('/lessons');
        },
        tryAutoLogin({commit}) {
            const session_uuid = localStorage.getItem('session_uuid');
            if (!session_uuid) {
                return
            }
            const expirationDate = localStorage.getItem('expirationDate');
            const user = JSON.parse(localStorage.getItem('user'));
            const now = new Date()
            if (now >= expirationDate) {
                return
            }
            commit('authUser', session_uuid);
            commit('storeUser', user);
        },
        logout({commit}) {
            commit('clearAuthData');
            localStorage.removeItem('expirationDate');
            localStorage.removeItem('session_uuid');
            localStorage.removeItem('user');
            router.replace('/signin');
        },
        storeUser({commit, state}, userData) {
            if (!state.session_uuid) {
                return
            }
            axios.post('/users', userData)
                .then(res => console.log(res))
                .catch(error => console.log(error))
        },
        fetchUser({commit, state}) {
            if (!state.session_uuid) {
                return
            }
            axios.get('/users')
                .then(res => {
                    console.log(res);
                    const data = res.data;
                    const users = [];
                    for (let key in data) {
                        const user = data[key];
                        user.id = key;
                        users.push(user)
                    }
                    console.log(users);
                    commit('storeUser', users[0]);
                })
                .catch(error => console.log(error))
        }
    },
    getters: {
        user(state) {
            return state.user
        },
        isAuthenticated(state) {
            return state.session_uuid !== null
        },
        sessionUUID(state) {
            return state.session_uuid
        },
        isAdmin(state) {
            if (state.user) {
                return state.user.admin
            }
            return false
        },
        isOrganiser(state) {
            if (state.user) {
                return state.user.organiser
            }
            return false
        },
        isMentor(state) {
            if (state.user) {
                return state.user.mentor
            }
            return false
        },
        userName(state) {
            if (state.user) {
                return state.user.name + ' ' + state.user.surname
            }
            return ''
        }
    }
})