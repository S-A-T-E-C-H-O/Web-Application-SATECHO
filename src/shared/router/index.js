import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/bounded-contexts/auth/application/stores/auth.store'
import LoginView from '@/bounded-contexts/auth/presentation/views/LoginView.vue'
import SelectRoleView from "@/bounded-contexts/auth/presentation/views/SelectRoleView.vue";
import VerifyAccountView from '@/bounded-contexts/auth/presentation/views/VerifyAccountView.vue'
import VerifiedAccountView from '@/bounded-contexts/auth/presentation/views/VerifiedAccountView.vue'
import ExpiredVerificationLinkView from '@/bounded-contexts/auth/presentation/views/ExpiredVerificationLinkView.vue'
import OnboardingView from '@/bounded-contexts/onboarding/presentation/views/OnboardingView.vue'
import OnboardingAgronomistView from '@/bounded-contexts/onboarding/presentation/views/OnboardingAgronomistView.vue'
import AgriculturalDashboardView from '@/bounded-contexts/dashboard/presentation/views/AgriculturalDashboardView.vue'
import TelemetryDashboardView from '@/bounded-contexts/dashboard/presentation/views/TelemetryDashboardView.vue'
import HomeView from '@/shared/views/HomeView.vue'
import DashboardLayout from '@/shared/layouts/DashboardLayout.vue'
import AgronomistDashboardView from '@/bounded-contexts/dashboard/presentation/views/AgronomistDashboardView.vue'
import NotFoundView from '@/shared/views/NotFoundView.vue'
import ForgotPasswordView from '@/bounded-contexts/auth/presentation/views/ForgotPasswordView.vue'
import RecoveryEmailSentView from "@/bounded-contexts/auth/presentation/views/RecoveryEmailSentView.vue";
import ResetPasswordView from "@/bounded-contexts/auth/presentation/views/ResetPasswordView.vue";
import PasswordUpdatedView from "@/bounded-contexts/auth/presentation/views/PasswordUpdatedView.vue";

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
        redirect: '/dashboard',
        component: HomeView,
    },

    {
        path: '/dashboard/:section?',
        name: 'dashboard',
        component: AgriculturalDashboardView,
    },

    {
        path: '/telemetry',
        name: 'telemetry',
        component: TelemetryDashboardView,
    },

    {
        path: '/onboarding',
        name: 'onboarding',
        component: OnboardingView,
    },

    {
        path: '/onboarding-agronomist',
        name: 'onboarding-agronomist',
        component: OnboardingAgronomistView,
    },

    {
        path: '/register/select-role',
        name: 'select-role',
        component: SelectRoleView,
    },

    {
        path: '/verify-account',
        name: 'verify-account',
        component: VerifyAccountView,
    },

    {
        path: '/email-confirmation',
        name: 'email-confirmation',
        component: VerifiedAccountView,
    },

    {
        path: '/verification-expired',
        name: 'verification-expired',
        component: ExpiredVerificationLinkView,
    },

    {
        path: '/forgot-password',
        name: 'forgot-password',
        component: ForgotPasswordView,
    },

    {
        path: '/recovery-email-sent',
        name: 'recovery-email-sent',
        component: RecoveryEmailSentView
    },
    {
        path: '/reset-password',
        name: 'reset-password',
        component: ResetPasswordView
    },
    {
        path: '/password-updated',
        name: 'password-updated',
        component: PasswordUpdatedView
    },

    {
        path: '/dashboard/agronomist',
        component: DashboardLayout,
        meta: { role: 'agronomist' },
        children: [
            {
                path: '',
                name: 'agronomist-dashboard',
                component: AgronomistDashboardView
            },
            {
                path: 'parcels',
                name: 'agronomist-parcels',
                component: () => import('@/bounded-contexts/dashboard/presentation/views/AgronomistParcelsView.vue')
            },
            {
                path: 'parcels/:id',
                name: 'agronomist-parcel-detail',
                component: () => import('@/bounded-contexts/dashboard/presentation/views/ParcelDetailDashboardView.vue')
            },
            {
                path: 'priority-cases',
                name: 'agronomist-priority-cases',
                component: () => import('@/bounded-contexts/dashboard/presentation/views/PriorityCasesView.vue')
            },
            {
                path: 'priority-cases/:id',
                name: 'agronomist-priority-case-detail',
                component: () => import('@/bounded-contexts/dashboard/presentation/views/PriorityCaseDetailView.vue')
            },
            {
                path: 'analysis',
                name: 'agronomist-analysis',
                component: () => import('@/bounded-contexts/dashboard/presentation/views/AgronomistAnalysisView.vue')
            },
            {
                path: 'thresholds',
                name: 'agronomist-thresholds',
                component: () => import('@/bounded-contexts/dashboard/presentation/views/AgronomistThresholdsView.vue')
            },
            {
                path: 'security',
                name: 'agronomist-security',
                component: () => import('@/bounded-contexts/dashboard/presentation/views/AgronomistSecurityView.vue')
            },
            {
                path: 'notifications',
                name: 'agronomist-notifications',
                component: () => import('@/bounded-contexts/dashboard/presentation/views/NotificationsRulesView.vue')
            }
        ]
    },

    {
        path: '/dashboard/admin',
        component: DashboardLayout,
        meta: { role: 'admin' },
        children: [
            {
                path: '',
                name: 'admin-users',
                component: () => import('@/bounded-contexts/admin/presentation/views/AdminUsersView.vue')
            },
            {
                path: 'farms',
                name: 'admin-farms',
                component: () => import('@/bounded-contexts/admin/presentation/views/AdminFarmsView.vue')
            },
            {
                path: 'devices',
                name: 'admin-devices',
                component: () => import('@/bounded-contexts/dashboard/presentation/views/DeviceFleetView.vue')
            },
            {
                path: 'metrics',
                name: 'admin-metrics',
                component: () => import('@/bounded-contexts/admin/presentation/views/AdminMetricsView.vue')
            }
        ]
    },

    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFoundView
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach((to) => {
    const isProtectedRoute =
        to.path.startsWith('/dashboard') ||
        to.name === 'onboarding' ||
        to.name === 'onboarding-agronomist' ||
        to.name === 'telemetry'

    if (isProtectedRoute) {
        const authStore = useAuthStore()

        if (!authStore.isAuthenticated) {
            return {
                name: 'login',
                query: { redirect: to.fullPath },
            }
        }

        const requiredRole = to.meta?.role
        if (requiredRole && authStore.user?.role !== requiredRole) {
            const home = {
                admin: '/dashboard/admin',
                agronomist: '/dashboard/agronomist',
            }[authStore.user?.role] || '/dashboard'
            return home
        }
    }

    return true
})

export default router
