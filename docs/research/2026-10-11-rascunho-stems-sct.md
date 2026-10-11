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

## Manchas — gerador v2 + PRÉ-TESTE LLM (feedback do ozp: variar FORMA, não tamanho)

**v2 do gerador** (`plataforma/scripts/gen-mancha.mjs`): 8 arquétipos de forma
(blob, anel, lobos, coluna, diagonal, ilhas, raios, faixas) com dispersão
(sigma 1,6–5,0) e tinta (12–55%) sorteadas por seed — **canvas e rampa fixos**
(mesmo tamanho/orçamento de caracteres, como pedido). Determinismo por md5.

**Pré-teste (11/10)**: 14 candidatas (seeds 1–14, 5 arquétipos sorteados)
apresentadas ao gemini-3.1-flash-lite com a consigna da D5
(`~/code/f5-aplicador/pre-test-manchas.py`, idempotente). Resultados:

- **Respostas projetivas de fato**: "árvore de Natal" (diagonal), "máscara
  estilizada / emblema tribal" (anel), "criatura com olhos grandes e
  expressão enigmática" (ilhas), "alienígena ou robô minimalista" (faixas) —
  analogia + elaboração perceptiva, não descrição do meio. A menção "arte
  ASCII" abre a resposta porque a CONSIGNA a nomeia (priming do meio) — não
  domina o conteúdo; registrar como nota de método.
- **Distintividade** (1 − Jaccard médio entre respostas a estímulos
  diferentes): 0,69–0,83; melhores: seed 1 (0,826), 5 (0,756), 4 (0,750),
  11 (0,750), 9 (0,739), 13 (0,732).
- **glm-4.5v**: quota da zhipu ainda fechada (429) — coluna glm a completar
  re-rodando o script quando abrir (`python3 pre-test-manchas.py ... glm`).

**Recomendação das 9 a congelar** (cobertura de arquétipo + distintividade):
seeds **1, 13** (diagonal), **2** (lobos), **4, 11** (faixas), **5, 14**
(anel), **7, 9** (ilhas). Decisão final do ozp após olhar os renders.

### Exemplares (5 das recomendadas)

#### seed 1 (seed=1 arquétipo=diagonal sigma=3.2 tinta=17%)

```
- -           
            -            
            #            
        *  =+=  *        
    -      *+*      -    
      = ** %=% ** =      
       *# ++*++ #*       
    -   =**---**=   -    
     ==+%-@+++@-%+==     
  - +*=-=-- # --=-=*+ -  
  =    =##=+ +=##=    =
```

#### seed 5 (seed=5 arquétipo=anel sigma=4.6 tinta=26%)

```
=  =*=#=%*%=#=*=  =   
       -+* = = *+-       
      #+- @%=%@ -+#      
      -*+*= + =*+*-      
    *-*-=%*+#+*%=-*-*    
    **%+%*= * =*%+%**    
   *  -%%+=# #=+%%-  *   
     = *-#-*=*-#-* =     
    + -*%=*@@@*=%*- +    
       -*%  #  %*-       
       =  *=-=*  =
```

#### seed 4 (seed=4 arquétipo=faixas sigma=1.9 tinta=18%)

```
*  +   =     =   +  *  
  == =%-+%=#=#=%+-%= ==  
    *+-    *=*    -+*    
                         
                         
++*- #=    -=-    =# -*++
*   % %   -===-   % %   *
=-  = * +*# * #*+ * =  -=
       **       **       
   #+- +=* %#% *=+ -+#
```

#### seed 9 (seed=9 arquétipo=ilhas sigma=4.1 tinta=20%)

```
+-*-+ +-*-+       
    - *+== ### ==+* -    
  +  + - ==* *== - +  +  
    + *= -** **- =* +    
 + -*  -*  #-#  *-  *- + 
    +   #= *%* =#   +    
                         
     +-=   * *   =-+     
    *+-+   % %   +-+*    
   =  %+  == ==  +%  =   
      =+ #=-*-=# +=
```

#### seed 13 (seed=13 arquétipo=diagonal sigma=4.1 tinta=17%)

```
- = = -         
          +   +          
          -+++-          
      +    ===    +      
       * =++-++= *       
       #  = = =  #       
      =+=  +*+  =+=      
   -*  =- ==+== -=  *-   
     = ==* +++ *== =     
   =  # **+= =+** #  =   
  =+  #%#--   --#%#  +=
```

### Análise v0 (D3 — descritiva, juiz adiado)

1. Taxa de completion e comprimento por modelo/domínio;
2. Deriva direcional por par (codificação humana de amostra primeiro — gabarito);
3. Léxico de referência: concealment do Mask (83 palavras) como tradução futura,
   não como métrica do dia 1;
4. Comparação humano × sintético com o mesmo documento (o lado humano entra na S2).

## Próximos passos (após revisão deste rascunho)

S2 publicar pacote `sct-frases` (stems aprovados + termo + textarea) → S3
congelar 9 manchas com manifest sha1 → S5 rodada 1 (D4).
