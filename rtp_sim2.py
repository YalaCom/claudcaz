import random

symbols = {
    "low1": [40, 0.6, 1.5, 4.5],
    "low2": [36, 0.75, 1.8, 6.0],
    "low3": [32, 0.9, 2.4, 7.5],
    "low4": [28, 1.2, 3.0, 9.0],
    "mid1": [16, 1.5, 4.5, 12.0],
    "mid2": [12, 1.8, 6.0, 18.0],
    "mid3": [8,  2.4, 7.5, 24.0],
    "high": [4,  4.5, 15.0, 45.0],
    "wild": [3,  6.0, 18.0, 60.0],
    "scat": [3,  6.0, 15.0, 60.0],
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
    grid = []
    for r in range(5):
        col = random.choices(names, weights=weights, k=3)
        grid.append(col)
    return grid

def eval_line(grid, line, bet):
    syms = [grid[reel][line[reel]] for reel in range(5)]
    first = syms[0]
    if first == "scat":
        return 0
    target = first
    if target == "wild":
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

def simulate(n, bet=1.0):
    total_bet = 0.0
    total_win = 0.0
    fs_triggers = 0
    hit_count = 0
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
            fs_win = 0.0
            for _ in range(fs):
                fgrid = spin_grid()
                for line in PAYLINES:
                    fs_win += eval_line(fgrid, line, bet)
            win += fs_win
        if win > 0:
            hit_count += 1
        total_win += win
    return total_win/total_bet, fs_triggers/n, hit_count/n

if __name__ == "__main__":
    random.seed(7)
    rtp, fs_rate, hit_rate = simulate(500000)
    print(f"RTP: {rtp*100:.2f}%  FreeSpin: 1/{1/fs_rate:.0f}  HitFreq: {hit_rate*100:.1f}%")

def bonus_buy_ev(trials=200000, bet=1.0):
    total = 0.0
    for _ in range(trials):
        win = 0.0
        # weighted scatter count distribution when forcing a trigger (>=3 scatters)
        # simulate by rejection: force at least 3 scatters by re-rolling scatter positions
        count = random.choices([3,4,5], weights=[0.72,0.21,0.07])[0]  # approx real distribution among triggers
        fs = FS_TABLE[count]
        fs_win = 0.0
        for _ in range(fs):
            grid = spin_grid()
            for line in PAYLINES:
                fs_win += eval_line(grid, line, bet)
        total += fs_win
    return total/trials

if __name__ == "__main__":
    random.seed(11)
    avg_fs_win = bonus_buy_ev(100000)
    print(f"Average free-spins-only win per trigger: {avg_fs_win:.2f}x bet")
    print(f"Fair bonus buy price (100% RTP breakeven): {avg_fs_win:.1f}x bet")
    print(f"Bonus buy price at 96% RTP: {avg_fs_win/0.96:.1f}x bet")
