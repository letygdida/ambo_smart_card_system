const authRoutes = require('./routes/auth');

console.log('Auth routes type:', typeof authRoutes);
console.log('Auth routes stack:', authRoutes.stack ? authRoutes.stack.length : 'No stack');

if (authRoutes.stack) {
    console.log('\nRegistered routes:');
    authRoutes.stack.forEach((layer, index) => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
            console.log(`${index + 1}. ${methods} ${layer.route.path}`);
        }
    });
}

process.exit(0);
