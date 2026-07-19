const http = require('http');
http.get('http://localhost:3000/api/terceros/EMP000001/terceros', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    if(json.success && json.data.length > 0) {
      console.log(Object.keys(json.data[0]));
      console.log(json.data[0]);
    } else {
      console.log('No data');
    }
  });
});
