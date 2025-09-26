const { type, name } = $arguments
const compatible_outbound = {
  tag: 'COMPATIBLE',
  type: 'direct',
}

let compatible
let config = JSON.parse($files[0])
let proxies = await produceArtifact({
  name,
  type: /^1$|col/i.test(type) ? 'collection' : 'subscription',
  platform: 'sing-box',
  produceType: 'internal',
})

// 0) 移除所有 -auto 分组
if (Array.isArray(config.outbounds)) {
  config.outbounds = config.outbounds.filter(ob => !(ob && typeof ob.tag === 'string' && /-auto$/i.test(ob.tag)))
} else {
  config.outbounds = []
}

// 1) 注入生成的节点
config.outbounds.push(...proxies)

// 2) 仅处理非 auto 分组
config.outbounds.map(i => {
  if (!Array.isArray(i.outbounds)) return

  if (i.tag === 'all') {
    i.outbounds.push(...getTags(proxies))
  }
  if (i.tag === 'hk') {
    i.outbounds.push(...getTags(proxies, /港|hk|hong\s*kong|kong\s*kong|🇭🇰/i))
  }
  if (i.tag === 'tw') {
    i.outbounds.push(...getTags(proxies, /台|tw|taiwan|🇹🇼/i))
  }
  if (i.tag === 'jp') {
    i.outbounds.push(...getTags(proxies, /日本|jp|japan|🇯🇵/i))
  }
  if (i.tag === 'sg') {
    i.outbounds.push(...getTags(proxies, /^(?!.*(?:us|united\s*states)).*(新|sg|singapore|🇸🇬)/i))
  }
  if (i.tag === 'us') {
    i.outbounds.push(...getTags(proxies, /美|us|unitedstates|united\s*states|🇺🇸/i))
  }
  if (i.tag === '家宽') {
    i.outbounds.push(...getTags(proxies, /家宽/i))
  }
})

// 3) 空分组兜底直连
config.outbounds.forEach(outbound => {
  if (Array.isArray(outbound.outbounds) && outbound.outbounds.length === 0) {
    if (!compatible) {
      config.outbounds.push(compatible_outbound)
      compatible = true
    }
    outbound.outbounds.push(compatible_outbound.tag)
  }
})

$content = JSON.stringify(config, null, 2)

function getTags(proxies, regex) {
  return (regex ? proxies.filter(p => regex.test(p.tag)) : proxies).map(p => p.tag)
}
