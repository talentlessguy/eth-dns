const REDIRECT_IP = '127.0.0.1'

const server = Deno.listenDatagram({
  port: 3333,
  transport: 'udp',
  hostname: '0.0.0.0',
})

console.log('DNS<->ENS server is running at udp://0.0.0.0:3333')

for await (const [buf, addr] of server) {
  // Parse the DNS request
  const transactionId = buf.slice(0, 2)
  let offset = 12
  let qname = ''

  while (buf[offset] !== 0) {
    const length = buf[offset]
    qname +=
      new TextDecoder().decode(buf.slice(offset + 1, offset + 1 + length)) + '.'
    offset += length + 1
  }

  offset += 1 // null terminator
  offset += 4

  console.log(`Received query for: ${qname}`)

  let response
  if (qname.endsWith('.eth.')) {
    // Construct response for .eth domain
    const responseHeader = new Uint8Array([
      ...transactionId,
      0x81,
      0x80, // flags
      0x00,
      0x01, // questions
      0x00,
      0x01, // answer RRs
      0x00,
      0x00, // authority RRs
      0x00,
      0x00, // additional RRs
    ])

    const responseQuestion = buf.slice(12, offset)
    const namePointer = new Uint8Array([0xc0, 0x0c])
    const responseAnswer = new Uint8Array([
      ...namePointer, // pointer to the name
      0x00,
      0x01, // type A
      0x00,
      0x01, // class IN
      0x00,
      0x00,
      0x01,
      0x2c, // TTL 300
      0x00,
      0x04, // RDLENGTH
      ...REDIRECT_IP.split('.').map((octet) => parseInt(octet)), // RDATA
    ])

    response = new Uint8Array([
      ...responseHeader,
      ...responseQuestion,
      ...responseAnswer,
    ])
  } else {
    // Construct response for other domains (NXDOMAIN)
    const responseHeader = new Uint8Array([
      ...transactionId,
      0x81,
      0x83, // flags (with NXDOMAIN status)
      0x00,
      0x01, // questions
      0x00,
      0x00, // answer RRs
      0x00,
      0x00, // authority RRs
      0x00,
      0x00, // additional RRs
    ])

    const responseQuestion = buf.slice(12, offset)
    response = new Uint8Array([
      ...responseHeader,
      ...responseQuestion,
    ])
  }

  await server.send(response, addr)
}
