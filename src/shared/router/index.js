import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '@/bounded-contexts/auth/presentation/views/LoginView.vue'
import SelectRoleView from "@/bounded-contexts/auth/presentation/views/SelectRoleView.vue";
import VerifyAccountView from '@/bounded-contexts/auth/presentation/views/VerifyAccountView.vue'
import VerifiedAccountView from '@/bounded-contexts/auth/presentation/views/VerifiedAccountView.vue'
import ExpiredVerificationLinkView from '@/bounded-contexts/auth/presentation/views/ExpiredVerificationLinkView.vue'
import OnboardingView from '@/bounded-contexts/onboarding/presentation/views/OnboardingView.vue'
import HomeView from '@/shared/views/HomeView.vue'

const routes = [
    {
        path: '/',
        redirect: '/login',
    },

    {
        path: '/login',
        name: 'login',
        component: LoginView,
    },

    {
        path: '/home',
        name: 'home',
        component: HomeView,
    },

    {
        path: '/onboarding',
        name: 'onboarding',
        component: OnboardingView,
    },

    {
        path: '/register/select-role',
        name: 'select-role',
        component: SelectRoleView,
    },

    {
        path: '/verify-account',
        name: 'verify-account',
        component: VerifyAccountView
    },

    {
        path: '/email-confirmation',
        name: 'email-confirmation',
        component: VerifiedAccountView
    },

    {
        path: '/verification-expired',
        name: 'verification-expired',
        component: ExpiredVerificationLinkView,
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
