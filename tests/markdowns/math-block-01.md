$$
\left(\begin{array}{c}
\hat{F}_{1,i,j}\\ \hat{F}_{2,i,j} \\ \vdots \\ \hat{F}_{C-1,i,j} \\ \hat{F}_{C,i,j}
\end{array}\right)

=

\begin{pmatrix}
\frac{\gamma_1}{\sqrt{\hat{\sigma}^2_1}+\epsilon} & 0 & \cdots & &0
\\
0 && \frac{\gamma_2}{\sqrt{\hat{\sigma}^2_2}+\epsilon} & & & &
\\
\vdots && \ddots && \vdots
\\
&&& \frac{\gamma_{C-1}}{\sqrt{\hat{\sigma}^2_{C-1}+\epsilon}} & 0
\\
0 && \cdots &0 & \frac{\gamma_C}{\sqrt{\hat{\sigma}^2_{C}+\epsilon}}

\end{pmatrix}


\cdot

\begin{pmatrix}
F_{1,i,j}
\\
F_{2,i,j}
\\
\vdots
\\
F_{C-1,i,j}
\\

F_{C,i,j}
\end{pmatrix}

+

\begin{pmatrix}
\beta_1-\gamma_1\frac{\hat{\mu}_1}{\sqrt{\hat{\sigma}^2_1+\epsilon}}
\\
\beta_2-\gamma_2\frac{\hat{\mu}_2}{\sqrt{\hat{\sigma}^2_2+\epsilon}}
\\
\vdots
\\
\beta_{C-1}-\gamma_{C-1}\frac{\hat{\mu}_{C-1}}{\sqrt{\hat{\sigma}^2_{C-1}+\epsilon}}
\\
\beta_C-\gamma_C\frac{\hat{\mu}_C}{\sqrt{\hat{\sigma}^2_C+\epsilon}}

\end{pmatrix} 
$$
