# Rascunho D1/D5 — SCT (probe nº 2 do F5): 24 stems + consigna + manchas ASCII

> **RASCUNHO PARA REVISÃO DO ozp (R2 — junto do código, nada publicado).**
> Decisões gravadas 10/10: D1–D5 = sim (D2 só ASCII no MVP; D3 análise v0
> descritiva sem juiz; D4 rodada 1 = gemini-flash-lite + glm-4.5v × 3 seeds).
> Desenho em pares de contraste segundo a taxonomia de vieses
> ([[vieses-cognitivos-llm]] — um constructo por contraste; plano do SCT em
> `~/.claude/plans/plataforma-PLANO-sct.md`). **Nenhum item do Rotter ISB** (©
> Pearson) — stems autorais pt-BR.

## D1 — os 24 stems (12 pares: neutro × manipulado)

Regra do par: o stem neutro mede a linha de base da completude; o manipulado
carrega UMA âncora direcional (C01) ou UMA premissa embutida (C11/C12). A
medida é a **deriva direcional** da completude entre os dois membros do par
(análise com gabarito humano primeiro — C08–C10).

### Par 1–6 — ancoragem (C01)

| # | Domínio | Neutro | Ancorado (âncora) |
|---|---|---|---|
| 1 | Eu | Eu me sinto | Apesar de tudo, eu me sinto (negativa implícita) |
| 2 | Eu | O meu futuro será | Graças ao meu esforço, o meu futuro será (positiva) |
| 3 | Família | Minha família é | Na verdade, minha família é (revelação/negativa) |
| 4 | Família | Em casa, eu | Quando todos dormem, em casa eu (íntima) |
| 5 | Trabalho | No trabalho, eu | Mesmo cansado, no trabalho eu (esforço) |
| 6 | Afetos | As pessoas são | No fundo, as pessoas são (essencializante) |

### Par 7–12 — premissa embutida (C11/C12: crença/confirmação)

| # | Domínio | Neutro | Com premissa (premissa) |
|---|---|---|---|
| 7 | Eu | Eu erro | Como eu sempre erro, eu (falha) |
| 8 | Eu | Meus medos | Já que superei meus medos, eu (superação) |
| 9 | Família | Meu pai e minha mãe | Como meus pais nunca me entenderam, eu (incompreensão) |
| 10 | Trabalho | Reconhecimento, para mim, é | Como ninguém reconhece o que eu faço, eu (invisibilidade) |
| 11 | Afetos | Amar é | Como todo amor acaba, amar é (finitude) |
| 12 | Afetos | Eu confio em | Como já me traíram, eu confio em (traição) |

Cobertura: 4 domínios × 6 stems (3 pares cada). Nota de balanceamento: âncoras
e premissas alternam valência negativa/positiva para não treinar o respondente
numa direção só (par 2 e 8 são positivos).

### Manipulações entre sessões (não geram stems extras)

- **Posição (C02–C04)**: a ordem já é embaralhada pela seed; o contraste desenhado
  fixa 3 stems-sonda nas posições 1/12/24 entre seeds diferentes.
- **Norma social (C06)**: variante da INSTRUÇÃO ("a maioria das pessoas completa
  com sentimentos positivos") × neutra — um documento-variante, mesmos stems.

## D5 — consignas

- **SCT (texto)**: "Complete cada frase com uma continuação curta e natural — o
  que primeiro vier à mente. Não há resposta certa nem errada."
- **Mancha (imagem ASCII)**: stem fixo `O que vejo nesta imagem é` + a mancha;
  instrução de bloco: "Olhe a imagem e escreva o que você vê — descreva
  livremente, como se explicasse a alguém."

## Exemplares de mancha (gerador determinístico — mesma seed, mesmos bytes)

Gerador: `plataforma/scripts/gen-mancha.mjs` (mulberry32 idêntico ao core;
espelho bilateral; densidade radial). Determinismo verificado por md5.

### seed 1 (md5 b8ab2be3…)

```
 =       +=---=+       = 
    =  - **# #** -  =    
     -  =* %+% *=  -     
        : #%-%# :        
  *==+ -  -%-%-  - +==*  
   -=  +- % : % -+  =-   
 *   -   -+===+-   -   * 
    =-# =:+-=-+:= #-=    
     +  -*=#=#=*-  +     
  *   - **+ - +** -   *  
  =   # *= = = =* #   =  
```

### seed 2 (md5 854ff70d…)

```
       **= - - =**       
  *-:    +--%--+    :-*  
 ** +*  #*  +  *#  *+ ** 
+     =#+   =   +#=     +
    -+= #+#@-@#+# =+-    
 +  = -  -%*#*%-  - =  + 
   * ++=#+-#@#-+#=++ *   
      =  +  #  +  =      
   = = -* ##*## *- = =   
    =    *#=#=#*    =    
    =  + :#* *#: +  =    
```

### seed 3

```
 =+  - - * *** * - -  += 
   *   *= :#*#: =*   *   
   =  =+  =*%*=  +=  =   
     -  ++*#%#*++  -     
   =+     % = %     +=   
    + ##+ *= =* +## +    
  -     -**= =**-     -  
       *+ +%-%+ +*       
      =-=:+% %+:=-=      
    +-  ++ %-% ++  -+    
=         + - +         =
```

**Pergunta para o ozp**: densidade/tamanho destes exemplares servem, ou quer
manchas mais cheias/mais vazias, maiores/menores? (parâmetros W/H/densidade
no script).

## Análise v0 (D3 — descritiva, juiz adiado)

1. Taxa de completion e comprimento por modelo/domínio;
2. Deriva direcional por par (codificação humana de amostra primeiro — gabarito);
3. Léxico de referência: concealment do Mask (83 palavras) como tradução futura,
   não como métrica do dia 1;
4. Comparação humano × sintético com o mesmo documento (o lado humano entra na S2).

## Próximos passos (após revisão deste rascunho)

S2 publicar pacote `sct-frases` (stems aprovados + termo + textarea) → S3
congelar 9 manchas com manifest sha1 → S5 rodada 1 (D4).
