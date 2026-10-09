import { createTimestamp, logEvent } from './lib/ots-manager.js';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('📝 Употреба: node main.js <файл1> [файл2] ...');
  console.log('📌 Примери:');
  console.log('   node main.js document.txt');
  console.log('   node main.js file1.pdf file2.docx');
  process.exit(0);
}

async function main() {
  console.log(`🚀 Започвам заверка на ${args.length} файл(а)...\n`);
  
  for (const filePath of args) {
    try {
      const result = await createTimestamp(filePath);
      console.log(`✅ ${result.file}:`);
      console.log(`   📊 Хеш: ${result.hash.slice(0, 20)}...`);
      console.log(`   📁 .ots: ${result.otsPath}`);
      console.log(`   ⏳ Статус: ${result.status}`);
      console.log('');
      logEvent(`Създаден печат за ${result.file}`, 'info');
    } catch (err) {
      console.error(`❌ Грешка при ${filePath}: ${err.message}`);
      logEvent(`Грешка при ${filePath}: ${err.message}`, 'error');
    }
  }
  
  console.log('⏳ Печатите са създадени.');
  console.log('📂 ./data/pending/');
  console.log('');
  console.log('💡 За фоновия процес: node timestamp-queue.js');
}

main();