document.querySelectorAll('h1')[1].textContent += ' v' + window.getComputedStyle(document.querySelector('html'), '::after').getPropertyValue('content').replace(/["']/g, '');
