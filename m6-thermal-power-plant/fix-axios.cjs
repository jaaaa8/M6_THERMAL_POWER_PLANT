const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, level) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (filePath.endsWith('apiClient.js') || filePath.endsWith('authService.js')) return;
  
  const relativePath = level === 1 ? './apiClient' : '../apiClient';
  
  if (content.includes('import axios from \'axios\';')) {
    content = content.replace('import axios from \'axios\';', 'import apiClient from \'' + relativePath + '\';');
    content = content.replace(/axios\./g, 'apiClient.');
    fs.writeFileSync(filePath, content);
    console.log('Fixed ' + filePath);
  }
}

const servicesDir = path.join(__dirname, 'src', 'services');
fs.readdirSync(servicesDir).forEach(file => {
  const fullPath = path.join(servicesDir, file);
  if (fs.statSync(fullPath).isDirectory()) {
    fs.readdirSync(fullPath).forEach(subFile => {
      const subFullPath = path.join(fullPath, subFile);
      if (subFile.endsWith('.js')) replaceInFile(subFullPath, 2);
    });
  } else if (file.endsWith('.js')) {
    replaceInFile(fullPath, 1);
  }
});
