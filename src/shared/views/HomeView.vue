<template>
  <main class="p-8">
    <h1 class="text-3xl font-bold mb-4">{{ $t('general.welcome') }}</h1>
    <p class="text-gray-600">{{ $t('general.language') }}: {{ $i18n.locale === 'en' ? $t('general.english') : $t('general.spanish') }}</p>
  </main>
</template>