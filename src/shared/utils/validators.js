export const validateFullName = (fullName) => {
    if (!fullName) return ''
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/
    if (!regex.test(fullName)) {
        return 'El nombre no debe contener números ni símbolos'
    }
    const words = fullName.trim().split(/\s+/)
    if (words.length < 2) {
        return 'Ingresa nombres y apellidos'
    }
    return ''
}

export const validateEmail = (email) => {
    if (!email) return ''
    const regex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!regex.test(email)) {
        return 'Ingresa un correo electrónico válido'
    }
    return ''
}

export const validatePhone = (phone) => {
    if (!phone) return ''
    const regex = /^[0-9]+$/
    if (!regex.test(phone)) {
        return 'Solo se permiten números'
    }
    if (phone.length !== 9) {
        return 'El número debe contener 9 dígitos'
    }
    return ''
}

export const getPasswordRules = (password) => ({
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
})