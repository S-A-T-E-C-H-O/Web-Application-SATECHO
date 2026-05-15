import i18n from '@/shared/i18n'

export const validateFullName = (fullName) => {
    if (!fullName) return ''
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/
    if (!regex.test(fullName)) {
        return i18n.global.t('validation.fullNameInvalidChars')
    }
    const words = fullName.trim().split(/\s+/)
    if (words.length < 2) {
        return i18n.global.t('validation.fullNameMissingParts')
    }
    return ''
}

export const validateEmail = (email) => {
    if (!email) return ''
    const regex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!regex.test(email)) {
        return i18n.global.t('validation.emailInvalid')
    }
    return ''
}

export const validatePhone = (phone) => {
    if (!phone) return ''
    const regex = /^[0-9]+$/
    if (!regex.test(phone)) {
        return i18n.global.t('validation.phoneNumbersOnly')
    }
    if (phone.length !== 9) {
        return i18n.global.t('validation.phoneLength')
    }
    return ''
}

export const getPasswordRules = (password) => ({
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
})
