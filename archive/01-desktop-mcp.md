# Desktop MCP - Correções de Issues

## 📌 Informações Gerais

- **Repositório:** https://github.com/groq/groq-desktop-beta
- **Status:** Planejado
- **Tipo:** Correções e melhorias
- **Prioridade:** Média

## 🎯 Objetivo

Corrigir duas issues críticas na aplicação desktop MCP que afetam a experiência do usuário.

## 🐛 Issues Identificadas

### Issue 1: Bloqueio de Imagens por Content-Security-Policy

**Problema:**
- Imagens de gráficos geradas pelo serviço antv-chart são bloqueadas pelo CSP
- O CSP atual permite apenas `img-src 'self' data:`
- URLs retornadas apontam para `https://mdn.alipayobjects.com/`
- Resultado: imagem quebrada (broken icon)

**Impacto:**
- Gráficos não são exibidos
- Impossível visualizar dados em formato visual

**Reprodução:**
1. Solicitar gráfico no chat (ex: ticker MXRF11)
2. API retorna URL `https://mdn.alipayobjects.com/one_clip/afts/img/.../original`
3. Navegador bloqueia carregamento
4. Console mostra erro CSP

**Soluções Propostas:**

1. **Atualizar CSP** (mais simples)
   ```
   Content-Security-Policy: img-src 'self' data: https://mdn.alipayobjects.com;
   ```

2. **Converter para Data URI** (mais seguro)
   - Backend busca imagem
   - Converte para base64
   - Retorna `data:image/png;base64,...`

3. **Proxy interno** (mais controle)
   - Rota `/api/chart-proxy?url=...`
   - Requisição via mesmo origin

---

### Issue 2: Interface de Correção Ortográfica Incompleta

**Problema:**
- Palavras incorretas são sublinhadas (verificação ativa)
- Clique direito NÃO exibe menu de sugestões
- Sem opção para alterar idioma de verificação
- Comportamento inconsistente com editores web padrão

**Impacto:**
- Experiência frustrante para o usuário
- Sem sugestões para correção
- Idioma fixo (provavelmente padrão do navegador)

**Reprodução:**
1. Digitar palavra incorreta (ex: "prgrama")
2. Observar sublinhado vermelho
3. Clicar direito
4. Menu nativo não aparece ou não tem sugestões

**Soluções Propostas:**

1. **Habilitar menu nativo**
   - Garantir `spellcheck="true"` nos inputs/textareas
   - Remover `preventDefault()` do evento `contextmenu`

2. **Biblioteca customizada**
   - Implementar TinyMCE, Quill ou ProseMirror
   - Plugin de spell-check com UI própria

3. **Seletor de idioma**
   - Adicionar dropdown nas configurações
   - Definir atributo `lang` no elemento editável
   - Exemplo: `<div contenteditable lang="en">`

4. **Documentar limitação** (solução temporária)
   - Se implementação completa não for viável
   - Adicionar nota no README/Help

---

## 📋 Checklist de Implementação

### Issue 1 - CSP
- [ ] Identificar arquivo de configuração CSP
- [ ] Escolher solução (atualizar CSP vs data URI vs proxy)
- [ ] Implementar solução escolhida
- [ ] Testar carregamento de gráficos
- [ ] Validar em diferentes navegadores

### Issue 2 - Spell-check
- [ ] Auditar código do componente de texto
- [ ] Verificar evento `contextmenu`
- [ ] Implementar seletor de idioma
- [ ] Testar menu de sugestões
- [ ] Documentar configuração

---

## 🔧 Tecnologias Envolvidas

- Content Security Policy (CSP)
- HTML5 Spellcheck API
- Express/Node.js (provável backend)
- React (provável framework frontend)

---

## 📝 Observações

- Aplicação é open-source - CSP editável
- Issues afetam apenas visualização/UX, não funcionalidade core
- Testes necessários em Chrome, Edge e Firefox
- Componente de texto é `<textarea>` React

---

## ✅ Critérios de Aceite

1. Gráficos são exibidos corretamente
2. Console não exibe erros CSP
3. Menu de correção ortográfica funciona
4. Usuário pode alterar idioma de verificação
5. Comportamento consistente entre navegadores
