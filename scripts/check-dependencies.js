const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking dependencies before packaging...\n');

const requiredTools = [
  { name: 'yt-dlp', command: 'yt-dlp --version' },
  { name: 'spotdl', command: 'spotdl --version' },
  { name: 'scdl', command: 'scdl --version' },
  { name: 'ffmpeg', command: 'ffmpeg -version' }
];

const requiredFiles = [
  'api_server.py',
  'database.py',
  'requirements.txt',
  'ffmpeg/ffmpeg'
];

let allGood = true;

// Check required tools
console.log('📦 Checking required tools:');
for (const tool of requiredTools) {
  try {
    const version = execSync(tool.command, { encoding: 'utf8' }).trim();
    console.log(`✅ ${tool.name}: ${version.split('\n')[0]}`);
  } catch (error) {
    console.log(`❌ ${tool.name}: NOT FOUND`);
    console.log(`   Please install: pip install ${tool.name}`);
    allGood = false;
  }
}

// Check required files
console.log('\n📁 Checking required files:');
for (const file of requiredFiles) {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}: Found`);
  } else {
    console.log(`❌ ${file}: NOT FOUND`);
    allGood = false;
  }
}

// Check Python dependencies
console.log('\n🐍 Checking Python dependencies:');
try {
  const requirements = fs.readFileSync('requirements.txt', 'utf8');
  const packages = requirements.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  // Some packages have different import names
  const importMap = {
    'yt-dlp': 'yt_dlp',
    'python-multipart': 'multipart',
    'python-dotenv': 'dotenv'
  };
  
  for (const pkg of packages) {
    const pkgName = pkg.split('==')[0].split('>=')[0].split('<=')[0].trim();
    const importName = importMap[pkgName] || pkgName;
    
    try {
      execSync(`python -c "import ${importName}"`, { stdio: 'ignore' });
      console.log(`✅ ${pkgName}: Installed`);
    } catch (error) {
      console.log(`❌ ${pkgName}: NOT INSTALLED`);
      console.log(`   Please install: pip install ${pkgName}`);
      allGood = false;
    }
  }
} catch (error) {
  console.log('❌ requirements.txt: NOT FOUND');
  allGood = false;
}

if (!allGood) {
  console.log('\n🚨 DEPENDENCY CHECK FAILED!');
  console.log('Please install all missing dependencies before packaging.');
  console.log('\nTo install Python dependencies:');
  console.log('  pip install -r requirements.txt');
  console.log('\nTo install tools:');
  console.log('  pip install yt-dlp spotdl scdl');
  console.log('  # ffmpeg should be installed via your system package manager');
  process.exit(1);
} else {
  console.log('\n✅ All dependencies are ready for packaging!');
  console.log('\n⚠️  IMPORTANT WARNING:');
  console.log('This packaged app will require users to have Python and the required tools installed.');
  console.log('Consider creating a standalone installer or using a different approach for distribution.');
} 