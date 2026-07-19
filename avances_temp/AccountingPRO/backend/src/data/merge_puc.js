const fs = require('fs');
const path = require('path');

const part1 = require('./puc_part1.json');
const part2 = require('./puc_part2.json');
const part3 = require('./puc_part3.json');

// Unir todas las cuentas en un solo arreglo
const allAccounts = [...part1, ...part2, ...part3];

// Remover duplicados (si los hay) basados en el código
const uniqueAccounts = [];
const seenCodes = new Set();

for (const acc of allAccounts) {
  if (!seenCodes.has(acc.codigo)) {
    seenCodes.add(acc.codigo);
    uniqueAccounts.push(acc);
  } else {
    console.warn(`Duplicado encontrado: ${acc.codigo} - ${acc.nombre}`);
  }
}

// Ordenar por código (como string para mantener jerarquía)
uniqueAccounts.sort((a, b) => a.codigo.localeCompare(b.codigo));

fs.writeFileSync(
  path.join(__dirname, 'puc_colombia.json'),
  JSON.stringify(uniqueAccounts, null, 2)
);

console.log(`PUC combinado y guardado exitosamente con ${uniqueAccounts.length} cuentas únicas.`);
