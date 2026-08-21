import random

# Symbols: id -> (weight, pay3, pay4, pay5)
SCALE = 2.98
symbols = {
    "low1": [40, 0.2*SCALE, 0.5*SCALE, 1.5*SCALE],
    "low2": [36, 0.25*SCALE, 0.6*SCALE, 2.0*SCALE],
    "low3": [32, 0.3*SCALE, 0.8*SCALE, 2.5*SCALE],
    "low4": [28, 0.4*SCALE, 1.0*SCALE, 3.0*SCALE],
    "mid1": [16, 0.5*SCALE, 1.5*SCALE, 4.0*SCALE],
    "mid2": [12, 0.6*SCALE, 2.0*SCALE, 6.0*SCALE],
    "mid3": [8,  0.8*SCALE, 2.5*SCALE, 8.0*SCALE],
    "high": [4,  1.5*SCALE, 5.0*SCALE, 15.0*SCALE],
    "wild": [3,  2.0*SCALE, 6.0*SCALE, 20.0*SCALE],
    "scat": [3,  2.0*SCALE, 5.0*SCALE, 20.0*SCALE],  # scatter pays on scatter count anywhere, handled separately
}

PAYLINES = [
    [1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],
    [0,1,2,1,0],[2,1,0,1,2],
    [0,0,1,2,2],[2,2,1,0,0],
    [1,0,0,0,1],[1,2,2,2,1],
    [0,1,1,1,0],[2,1,1,1,2],
    [1,1,0,1,1],[1,1,2,1,1],
    [0,2,0,2,0],[2,0,2,0,2],
    [1,0,1,2,1],[1,2,1,0,1],
    [0,0,2,0,0],[2,2,0,2,2],
    [0,2,2,2,0],
]

names = list(symbols.keys())
weights = [symbols[n][0] for n in names]

def spin_grid():
    # 5 reels x 3 rows, each cell independent draw (simplified iid model)
    grid = []
    for r in range(5):
        col = random.choices(names, weights=weights, k=3)
        grid.append(col)
    return grid

def eval_line(grid, line, bet):
    syms = [grid[reel][line[reel]] for reel in range(5)]
    first = syms[0]
    if first == "scat":
        return 0  # scatter not counted on payline matches (handled globally)
    target = first
    if target == "wild":
        # find first non-wild to define target
        for s in syms:
            if s != "wild":
                target = s
                break
        else:
            target = "wild"
    count = 0
    for s in syms:
        if s == target or s == "wild":
            count += 1
        else:
            break
    if count >= 3:
        pay_idx = {3:1,4:2,5:3}[min(count,5)]
        return symbols[target][pay_idx] * bet
    return 0

def eval_scatter(grid, bet):
    count = sum(row.count("scat") for row in grid)
    if count >= 3:
        pay_idx = {3:1,4:2}.get(count, 3)
        base = symbols["scat"][pay_idx] * bet
        return base, count
    return 0, count

FS_TABLE = {3:10, 4:15, 5:20}

def simulate(n, bet=1.0, freespin_mult=1.0, verbose=False):
    total_bet = 0.0
    total_win = 0.0
    fs_triggers = 0
    for _ in range(n):
        grid = spin_grid()
        total_bet += bet
        win = 0.0
        for line in PAYLINES:
            win += eval_line(grid, line, bet)
        scat_win, scat_count = eval_scatter(grid, bet)
        win += scat_win
        if scat_count >= 3:
            fs_triggers += 1
            fs = FS_TABLE.get(scat_count, 20)
            # simulate free spins recursively (simplified, no retrigger for speed, apply small retrigger EV bump later)
            fs_win = 0.0
            for _ in range(fs):
                fgrid = spin_grid()
                for line in PAYLINES:
                    fs_win += eval_line(fgrid, line, bet)
            win += fs_win * freespin_mult
        total_win += win
    return total_win/total_bet, fs_triggers/n

if __name__ == "__main__":
    random.seed(42)
    rtp, fs_rate = simulate(400000)
    print(f"RTP: {rtp*100:.2f}%  FreeSpin trigger rate: 1 in {1/fs_rate:.0f} spins")
