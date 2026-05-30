if (!localStorage.getItem('token')) {
    console.warn('Unauthorized access attempt. Redirecting to auth page.');
    window.location.href = 'auth.html';
}
else {
    console.log('User is authenticated. Token found in localStorage.');
}