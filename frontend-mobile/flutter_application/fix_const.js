const fs = require('fs');

function fixConst(file) {
  if (!fs.existsSync(file)) return;
  let text = fs.readFileSync(file, 'utf8');
  
  // Replace const Icon(...) and const TextStyle(...) if they contain Theme.of
  text = text.replace(/const\s+(Icon|TextStyle)\s*\(([^)]*Theme\.of\(context\)[^)]*)\)/g, '$1($2)');
  
  // To handle multiline correctly with robust regex:
  text = text.replace(/const\s+(Icon|TextStyle|Text)\s*\([\s\S]*?\)/g, match => {
      if (match.includes('Theme.of(context)')) {
          return match.replace(/^const\s+/, '');
      }
      return match;
  });

  fs.writeFileSync(file, text);
  console.log(`Fixed ${file}`);
}

fixConst('lib/screens/manager_profile_screen.dart');
fixConst('lib/screens/employee/employee_profile_screen.dart');
